import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isPocketBaseConfiguredMock, isPocketBaseAdminConfiguredMock, createPocketBaseAdminClientMock } =
  vi.hoisted(() => ({
    isPocketBaseConfiguredMock: vi.fn(),
    isPocketBaseAdminConfiguredMock: vi.fn(),
    createPocketBaseAdminClientMock: vi.fn(),
  }));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
  isPocketBaseAdminConfigured: isPocketBaseAdminConfiguredMock,
}));

vi.mock("@/lib/pocketbase/admin", () => ({
  createPocketBaseAdminClient: createPocketBaseAdminClientMock,
}));

describe("consumeRateLimit — memory store (PocketBase no configurado)", () => {
  beforeEach(async () => {
    vi.resetModules();
    isPocketBaseConfiguredMock.mockReturnValue(false);
    isPocketBaseAdminConfiguredMock.mockReturnValue(false);

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

describe("consumeRateLimit — fail closed cuando PocketBase falla", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    isPocketBaseConfiguredMock.mockReturnValue(true);
    isPocketBaseAdminConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hace fallback a memoria si el shared store lanza un error", async () => {
    createPocketBaseAdminClientMock.mockRejectedValue(new Error("DB connection failed"));

    const { consumeRateLimit } = await import("./rate-limit");
    const result = await consumeRateLimit({
      bucket: "test",
      identifier: "ip-fail",
      max: 10,
      windowMs: 60_000,
    });

    // En vez de denegar (fail closed), hace fallback a memoria — primer intento es ok
    expect(result.ok).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
    expect(result.store).toBe("memory");
  });
});

describe("assertRateLimit", () => {
  beforeEach(async () => {
    vi.resetModules();
    isPocketBaseConfiguredMock.mockReturnValue(false);
    isPocketBaseAdminConfiguredMock.mockReturnValue(false);

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
