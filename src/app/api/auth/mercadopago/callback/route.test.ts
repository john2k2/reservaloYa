import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  isPocketBaseConfiguredMock,
  updateLocalBusinessMPTokensMock,
  parseMercadoPagoOAuthStateMock,
  getPocketBaseBusinessIdBySlugMock,
  updatePocketBaseBusinessMPTokensMock,
} = vi.hoisted(() => ({
  isPocketBaseConfiguredMock: vi.fn(),
  updateLocalBusinessMPTokensMock: vi.fn(),
  parseMercadoPagoOAuthStateMock: vi.fn(),
  getPocketBaseBusinessIdBySlugMock: vi.fn(),
  updatePocketBaseBusinessMPTokensMock: vi.fn(),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/server/local-store", () => ({
  updateLocalBusinessMPTokens: updateLocalBusinessMPTokensMock,
}));

vi.mock("@/server/mercadopago-oauth-state", () => ({
  parseMercadoPagoOAuthState: parseMercadoPagoOAuthStateMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  getPocketBaseBusinessIdBySlug: getPocketBaseBusinessIdBySlugMock,
  updatePocketBaseBusinessMPTokens: updatePocketBaseBusinessMPTokensMock,
}));

describe("mercadopago oauth callback route", () => {
  const originalFetch = global.fetch;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalAppId = process.env.MP_APP_ID;
  const originalAppSecret = process.env.MP_APP_SECRET;

  beforeEach(() => {
    vi.resetModules();
    isPocketBaseConfiguredMock.mockReset();
    updateLocalBusinessMPTokensMock.mockReset();
    parseMercadoPagoOAuthStateMock.mockReset();
    getPocketBaseBusinessIdBySlugMock.mockReset();
    updatePocketBaseBusinessMPTokensMock.mockReset();

    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.test";
    process.env.MP_APP_ID = "app-id";
    process.env.MP_APP_SECRET = "app-secret";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    process.env.MP_APP_ID = originalAppId;
    process.env.MP_APP_SECRET = originalAppSecret;
  });

  it("redirects with error when code or state is missing", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("https://reservaya.test/api/auth/mercadopago/callback"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });

  it("redirects with error when state is invalid", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue(null);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=invalid")
    );

    expect(response.status).toBe(307);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });

  it("redirects with error when OAuth app credentials are missing", async () => {
    process.env.MP_APP_ID = "   ";
    process.env.MP_APP_SECRET = "";
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(response.status).toBe(307);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });

  it("redirects with error when token exchange fails", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({ businessSlug: "demo-barberia" });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      text: async () => "mp error",
    } as Response);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(response.status).toBe(307);
    expect(updateLocalBusinessMPTokensMock).not.toHaveBeenCalled();
    expect(updatePocketBaseBusinessMPTokensMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });

  it("stores tokens in local mode and redirects to connected", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({ businessSlug: "demo-barberia" });
    isPocketBaseConfiguredMock.mockReturnValue(false);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "token-123",
        refresh_token: "refresh-123",
        user_id: 998877,
        expires_in: 3600,
      }),
    } as Response);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(updateLocalBusinessMPTokensMock).toHaveBeenCalledTimes(1);
    expect(updateLocalBusinessMPTokensMock.mock.calls[0][0]).toMatchObject({
      businessSlug: "demo-barberia",
      mpAccessToken: "token-123",
      mpRefreshToken: "refresh-123",
      mpCollectorId: "998877",
    });
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=connected"
    );
  });

  it("stores tokens in PocketBase mode using the resolved business id", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({ businessSlug: "demo-barberia" });
    isPocketBaseConfiguredMock.mockReturnValue(true);
    getPocketBaseBusinessIdBySlugMock.mockResolvedValue("biz-123");
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "token-123",
        refresh_token: "refresh-123",
        user_id: 998877,
        expires_in: 3600,
      }),
    } as Response);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(getPocketBaseBusinessIdBySlugMock).toHaveBeenCalledWith("demo-barberia");
    expect(updatePocketBaseBusinessMPTokensMock).toHaveBeenCalledTimes(1);
    expect(updatePocketBaseBusinessMPTokensMock.mock.calls[0][0]).toMatchObject({
      businessId: "biz-123",
      mpAccessToken: "token-123",
      mpRefreshToken: "refresh-123",
      mpCollectorId: "998877",
    });
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=connected"
    );
  });

  it("redirects with error when PocketBase business id cannot be resolved", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({ businessSlug: "demo-barberia" });
    isPocketBaseConfiguredMock.mockReturnValue(true);
    getPocketBaseBusinessIdBySlugMock.mockResolvedValue(null);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "token-123",
        refresh_token: "refresh-123",
        user_id: 998877,
        expires_in: 3600,
      }),
    } as Response);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(updatePocketBaseBusinessMPTokensMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });
});
