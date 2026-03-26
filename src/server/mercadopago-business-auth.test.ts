import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshMercadoPagoAccessTokenMock = vi.fn();

vi.mock("@/server/mercadopago", () => ({
  isMercadoPagoConfiguredForBusiness: vi.fn((token?: string) => Boolean(token)),
  refreshMercadoPagoAccessToken: refreshMercadoPagoAccessTokenMock,
}));

describe("business mercadopago auth", () => {
  beforeEach(() => {
    refreshMercadoPagoAccessTokenMock.mockReset();
  });

  it("returns the current token when it is still valid", async () => {
    const { getUsableBusinessMercadoPagoAccessToken } = await import(
      "./mercadopago-business-auth"
    );
    const persistMock = vi.fn(async () => undefined);

    const token = await getUsableBusinessMercadoPagoAccessToken(
      {
        businessId: "business-1",
        businessSlug: "demo-barberia",
        businessName: "Demo Barberia",
        mpConnected: true,
        mpCollectorId: "123456",
        mpAccessToken: "APP_USR_valid",
        mpRefreshToken: "refresh-token",
        mpTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      persistMock
    );

    expect(token).toBe("APP_USR_valid");
    expect(refreshMercadoPagoAccessTokenMock).not.toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
  });

  it("refreshes and persists tokens when the current token is expiring", async () => {
    refreshMercadoPagoAccessTokenMock.mockResolvedValue({
      ok: true,
      accessToken: "APP_USR_refreshed",
      refreshToken: "refresh-token-2",
      collectorId: "987654",
      expiresAt: "2026-03-24T12:00:00.000Z",
    });

    const { getUsableBusinessMercadoPagoAccessToken } = await import(
      "./mercadopago-business-auth"
    );
    const persistMock = vi.fn(async () => undefined);

    const token = await getUsableBusinessMercadoPagoAccessToken(
      {
        businessId: "business-1",
        businessSlug: "demo-barberia",
        businessName: "Demo Barberia",
        mpConnected: true,
        mpCollectorId: "123456",
        mpAccessToken: "APP_USR_old",
        mpRefreshToken: "refresh-token",
        mpTokenExpiresAt: new Date(Date.now() + 30_000).toISOString(),
      },
      persistMock
    );

    expect(token).toBe("APP_USR_refreshed");
    expect(refreshMercadoPagoAccessTokenMock).toHaveBeenCalledWith("refresh-token");
    expect(persistMock).toHaveBeenCalledWith({
      mpAccessToken: "APP_USR_refreshed",
      mpRefreshToken: "refresh-token-2",
      mpCollectorId: "987654",
      mpTokenExpiresAt: "2026-03-24T12:00:00.000Z",
    });
  });
});
