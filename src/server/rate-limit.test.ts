import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseAdminClientMock } = vi.hoisted(() => ({
  getSupabaseAdminClientMock: vi.fn(),
}));

vi.mock("@/server/supabase-store/_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

describe("consumeRateLimit — memory store en test/local", () => {
  beforeEach(async () => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();

    const { resetRateLimitStoreForTests } = await import("./rate-limit");
    resetRateLimitStoreForTests();
  });

  it("permite la primera request", async () => {
    const { consumeRateLimit } = await import("./rate-limit");
    const result = await consumeRateLimit({
      bucket: "test",
      identifier: "ip-1",
      max: 3,
      windowMs: 60_000,
    });

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.store).toBe("memory");
  });

  it("rechaza cuando se supera el límite", async () => {
    const { consumeRateLimit } = await import("./rate-limit");
    const config = { bucket: "test", identifier: "ip-2", max: 2, windowMs: 60_000 };

    await consumeRateLimit(config);
    await consumeRateLimit(config);
    const result = await consumeRateLimit(config);

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("identifiers distintos tienen buckets independientes", async () => {
    const { consumeRateLimit } = await import("./rate-limit");
    const base = { bucket: "test", max: 1, windowMs: 60_000 };

    const r1 = await consumeRateLimit({ ...base, identifier: "ip-A" });
    const r2 = await consumeRateLimit({ ...base, identifier: "ip-B" });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });
});

describe("consumeRateLimit — fail closed cuando Supabase falla", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    getSupabaseAdminClientMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deniega si el shared store lanza un error en producción", async () => {
    getSupabaseAdminClientMock.mockRejectedValue(new Error("DB connection failed"));

    const { consumeRateLimit } = await import("./rate-limit");
    const result = await consumeRateLimit({
      bucket: "test",
      identifier: "ip-fail",
      max: 10,
      windowMs: 60_000,
    });

    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBe(60);
    expect(result.store).toBe("supabase");
  });
});

describe("consumeRateLimit — Supabase RPC en producción", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    getSupabaseAdminClientMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("usa consume_rate_limit cuando la RPC está disponible", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ ok: true, remaining: 2, retryAfterSeconds: 0 }],
      error: null,
    });
    getSupabaseAdminClientMock.mockResolvedValue({ rpc: rpcMock });

    const { consumeRateLimit } = await import("./rate-limit");
    const result = await consumeRateLimit({
      bucket: "public-booking",
      identifier: "ip-1",
      max: 3,
      windowMs: 60_000,
    });

    expect(result).toEqual({ ok: true, remaining: 2, retryAfterSeconds: 0, store: "supabase" });
    expect(rpcMock).toHaveBeenCalledWith("consume_rate_limit", {
      p_bucket: "public-booking",
      p_identifier_hash: expect.any(String),
      p_max: 3,
      p_window_ms: 60_000,
    });
  });

  it("mantiene fallback compatible si la RPC todavía no existe", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const gtMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqIdentifierMock = vi.fn().mockReturnValue({ gt: gtMock });
    const eqBucketMock = vi.fn().mockReturnValue({ eq: eqIdentifierMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqBucketMock });
    const deleteMock = vi.fn().mockReturnValue({ lte: vi.fn().mockResolvedValue({ error: null }) });
    const fromMock = vi.fn().mockReturnValue({ delete: deleteMock, select: selectMock, insert: insertMock });
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST202", message: "Could not find the function public.consume_rate_limit" },
    });

    getSupabaseAdminClientMock
      .mockResolvedValueOnce({ rpc: rpcMock })
      .mockResolvedValueOnce({ from: fromMock });

    const { consumeRateLimit } = await import("./rate-limit");
    const result = await consumeRateLimit({
      bucket: "public-booking",
      identifier: "ip-1",
      max: 3,
      windowMs: 60_000,
    });

    expect(result).toEqual({ ok: true, remaining: 2, retryAfterSeconds: 0, store: "supabase" });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith({
      bucket: "public-booking",
      identifierHash: expect.any(String),
      expiresAt: expect.any(String),
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("assertRateLimit", () => {
  beforeEach(async () => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();

    const { resetRateLimitStoreForTests } = await import("./rate-limit");
    resetRateLimitStoreForTests();
  });

  it("no lanza si el rate limit no se superó", async () => {
    const { assertRateLimit } = await import("./rate-limit");
    await expect(
      assertRateLimit({
        bucket: "assert-test",
        identifier: "ip-ok",
        max: 5,
        windowMs: 60_000,
        message: "Too many requests",
      })
    ).resolves.not.toThrow();
  });

  it("lanza RateLimitError con retryAfterSeconds cuando se supera el límite", async () => {
    const { assertRateLimit, RateLimitError } = await import("./rate-limit");
    const config = {
      bucket: "assert-limit",
      identifier: "ip-limit",
      max: 1,
      windowMs: 60_000,
      message: "Demasiadas requests",
    };

    await assertRateLimit(config); // primera: ok
    await expect(assertRateLimit(config)).rejects.toThrow(RateLimitError);
  });
});

describe("getRateLimitIdentifier", () => {
  it("extrae la primera IP de x-forwarded-for", async () => {
    const { getRateLimitIdentifier } = await import("./rate-limit");
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getRateLimitIdentifier(headers)).toBe("1.2.3.4");
  });

  it("usa x-real-ip si no hay x-forwarded-for", async () => {
    const { getRateLimitIdentifier } = await import("./rate-limit");
    const headers = new Headers({ "x-real-ip": "9.10.11.12" });
    expect(getRateLimitIdentifier(headers)).toBe("9.10.11.12");
  });

  it("devuelve el fallback si no hay headers de IP", async () => {
    const { getRateLimitIdentifier } = await import("./rate-limit");
    const headers = new Headers();
    expect(getRateLimitIdentifier(headers, "anonymous")).toBe("anonymous");
  });
});
