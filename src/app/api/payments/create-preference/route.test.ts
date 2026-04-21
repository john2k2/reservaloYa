import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const { getAuthenticatedSupabaseUserMock } = vi.hoisted(() => ({
  getAuthenticatedSupabaseUserMock: vi.fn(),
}));

const { getBlueDollarRateMock } = vi.hoisted(() => ({
  getBlueDollarRateMock: vi.fn(),
}));

const { createSubscriptionPreferenceMock, isMercadoPagoConfiguredMock } = vi.hoisted(() => ({
  createSubscriptionPreferenceMock: vi.fn(),
  isMercadoPagoConfiguredMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/lib/dollar-rate", () => ({
  getBlueDollarRate: getBlueDollarRateMock,
}));

vi.mock("@/server/mercadopago", () => ({
  createSubscriptionPreference: createSubscriptionPreferenceMock,
  isMercadoPagoConfigured: isMercadoPagoConfiguredMock,
}));

describe("create preference route", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    getAuthenticatedSupabaseUserMock.mockReset();
    getBlueDollarRateMock.mockReset();
    createSubscriptionPreferenceMock.mockReset();
    isMercadoPagoConfiguredMock.mockReset();

    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.test";
    isMercadoPagoConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("redirects to admin login when there is no authenticated user", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    await expect(GET()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to admin login when user has no linked business", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "user@demo.com",
      role: "owner",
    });
    const { GET } = await import("./route");

    await expect(GET()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to subscription pay when MP is not configured", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    isMercadoPagoConfiguredMock.mockReturnValue(false);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/subscription/pay?error=mp_not_configured"
    );
  });

  it("creates a subscription preference and redirects to checkout", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    getBlueDollarRateMock.mockResolvedValue(1200);
    createSubscriptionPreferenceMock.mockResolvedValue({
      ok: true,
      preferenceId: "pref-123",
      checkoutUrl: "https://mp.test/checkout/123",
    });
    const { GET } = await import("./route");

    const response = await GET();

    expect(createSubscriptionPreferenceMock).toHaveBeenCalledWith({
      businessId: "biz-1",
      priceAmount: 17 * 1200,
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://mp.test/checkout/123");
  });

  it("redirects to error page when preference creation fails", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    getBlueDollarRateMock.mockResolvedValue(1200);
    createSubscriptionPreferenceMock.mockResolvedValue({
      ok: false,
      error: "MP error",
    });
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://reservaya.test/admin/subscription/pay?error=preference_failed"
    );
  });
});
