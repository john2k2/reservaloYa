import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const { createPocketBaseServerClientMock, refreshPocketBaseAuthMock } = vi.hoisted(() => ({
  createPocketBaseServerClientMock: vi.fn(),
  refreshPocketBaseAuthMock: vi.fn(),
}));

const { getBlueDollarRateMock } = vi.hoisted(() => ({
  getBlueDollarRateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/pocketbase/server", () => ({
  createPocketBaseServerClient: createPocketBaseServerClientMock,
  refreshPocketBaseAuth: refreshPocketBaseAuthMock,
}));

vi.mock("@/lib/dollar-rate", () => ({
  getBlueDollarRate: getBlueDollarRateMock,
}));

describe("create preference route", () => {
  const originalFetch = global.fetch;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalToken = process.env.MP_ACCESS_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    createPocketBaseServerClientMock.mockReset();
    refreshPocketBaseAuthMock.mockReset();
    getBlueDollarRateMock.mockReset();

    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.test";
    process.env.MP_ACCESS_TOKEN = "test-token";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    process.env.MP_ACCESS_TOKEN = originalToken;
    global.fetch = originalFetch;
  });

  function createPb(record: { business?: string | string[] } | null) {
    return {
      authStore: {
        record,
      },
    };
  }

  it("redirects to admin login when there is no authenticated business", async () => {
    createPocketBaseServerClientMock.mockResolvedValue(createPb(null));
    refreshPocketBaseAuthMock.mockResolvedValue(false);
    const { GET } = await import("./route");

    await expect(GET()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to subscription pay when MP token is missing", async () => {
    createPocketBaseServerClientMock.mockResolvedValue(createPb({ business: "biz-1" }));
    refreshPocketBaseAuthMock.mockResolvedValue(true);
    getBlueDollarRateMock.mockResolvedValue(1200);
    process.env.MP_ACCESS_TOKEN = "   ";
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/subscription/pay?error=mp_not_configured"
    );
  });

  it("creates a subscription preference and redirects to init_point", async () => {
    createPocketBaseServerClientMock.mockResolvedValue(createPb({ business: ["biz-1"] }));
    refreshPocketBaseAuthMock.mockResolvedValue(true);
    getBlueDollarRateMock.mockResolvedValue(1200);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ init_point: "https://mp.test/checkout/123" }),
    } as Response);
    const { GET } = await import("./route");

    const response = await GET();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.mercadopago.com/checkout/preferences",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://mp.test/checkout/123");
  });
});
