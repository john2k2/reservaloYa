import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminShellDataMock, createMercadoPagoOAuthStateMock } = vi.hoisted(() => ({
  getAdminShellDataMock: vi.fn(),
  createMercadoPagoOAuthStateMock: vi.fn(() => "signed-state"),
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
}));

vi.mock("@/server/mercadopago-oauth-state", () => ({
  createMercadoPagoOAuthState: createMercadoPagoOAuthStateMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    MP_APP_ID: "app-id",
    MP_APP_SECRET: "app-secret",
  },
}));

describe("mercadopago oauth start route", () => {
  beforeEach(() => {
    vi.resetModules();
    getAdminShellDataMock.mockReset();
    createMercadoPagoOAuthStateMock.mockReset();

    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.test";
    process.env.MP_APP_ID = "app-id";
    process.env.MP_APP_SECRET = "app-secret";

    getAdminShellDataMock.mockResolvedValue({
      businessId: "biz-123",
      businessSlug: "demo-barberia",
      userEmail: "owner@demo.com",
    });
    createMercadoPagoOAuthStateMock.mockReturnValue("signed-state");
  });

  it("starts oauth from the current admin session and sets a nonce cookie", async () => {
    const { GET } = await import("./route");

    const response = await GET();

    expect(createMercadoPagoOAuthStateMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      businessId: "biz-123",
      userEmail: "owner@demo.com",
      nonce: expect.any(String),
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("https://auth.mercadopago.com/authorization?");
    expect(response.headers.get("location")).toContain("state=signed-state");
    expect(response.headers.get("set-cookie")).toContain("reservaya-mp-oauth-nonce=");
  });
});
