import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  updateSupabaseBusinessMPTokensMock,
  getSupabaseBusinessIdBySlugMock,
  parseMercadoPagoOAuthStateMock,
  getAdminShellDataMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  updateSupabaseBusinessMPTokensMock: vi.fn(),
  getSupabaseBusinessIdBySlugMock: vi.fn(),
  parseMercadoPagoOAuthStateMock: vi.fn(),
  getAdminShellDataMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/server/supabase-store", () => ({
  getSupabaseBusinessIdBySlug: getSupabaseBusinessIdBySlugMock,
  updateSupabaseBusinessMPTokens: updateSupabaseBusinessMPTokensMock,
}));

vi.mock("@/server/mercadopago-oauth-state", () => ({
  parseMercadoPagoOAuthState: parseMercadoPagoOAuthStateMock,
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
}));

describe("mercadopago oauth callback route", () => {
  const originalFetch = global.fetch;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalAppId = process.env.MP_APP_ID;
  const originalAppSecret = process.env.MP_APP_SECRET;

  beforeEach(() => {
    vi.resetModules();
    updateSupabaseBusinessMPTokensMock.mockReset();
    getSupabaseBusinessIdBySlugMock.mockReset();
    parseMercadoPagoOAuthStateMock.mockReset();
    getAdminShellDataMock.mockReset();

    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.test";
    process.env.MP_APP_ID = "app-id";
    process.env.MP_APP_SECRET = "app-secret";
    global.fetch = vi.fn();
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "nonce-123" })),
    });
    getAdminShellDataMock.mockResolvedValue({
      businessId: "biz-123",
      businessSlug: "demo-barberia",
      userEmail: "owner@demo.com",
    });
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
    parseMercadoPagoOAuthStateMock.mockReturnValue({
      businessSlug: "demo-barberia",
      businessId: "biz-123",
      userEmail: "owner@demo.com",
      nonce: "nonce-123",
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      text: async () => "mp error",
    } as Response);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://reservaya.test/api/auth/mercadopago/callback?code=abc&state=valid-state")
    );

    expect(response.status).toBe(307);
    expect(updateSupabaseBusinessMPTokensMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=error"
    );
  });

  it("stores tokens using the businessId from the session and redirects to connected", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({
      businessSlug: "demo-barberia",
      businessId: "biz-123",
      userEmail: "owner@demo.com",
      nonce: "nonce-123",
    });
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

    expect(updateSupabaseBusinessMPTokensMock).toHaveBeenCalledTimes(1);
    expect(updateSupabaseBusinessMPTokensMock.mock.calls[0][0]).toMatchObject({
      businessId: "biz-123",
      mpAccessToken: "token-123",
      mpRefreshToken: "refresh-123",
      mpCollectorId: "998877",
    });
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=connected"
    );
  });

  it("resolves businessId from slug when not present in state", async () => {
    parseMercadoPagoOAuthStateMock.mockReturnValue({
      businessSlug: "demo-barberia",
      userEmail: "owner@demo.com",
      nonce: "nonce-123",
    });
    getSupabaseBusinessIdBySlugMock.mockResolvedValue("biz-from-slug");
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

    expect(getSupabaseBusinessIdBySlugMock).toHaveBeenCalledWith("demo-barberia");
    expect(updateSupabaseBusinessMPTokensMock).toHaveBeenCalledTimes(1);
    expect(updateSupabaseBusinessMPTokensMock.mock.calls[0][0]).toMatchObject({
      businessId: "biz-from-slug",
      mpAccessToken: "token-123",
    });
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/onboarding?tab=integraciones&mp=connected"
    );
  });
});
