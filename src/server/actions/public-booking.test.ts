import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const createLocalPublicBookingMock = vi.fn(async () => "booking-test-id");
const cancelLocalPublicBookingMock = vi.fn(async () => "booking-test-id");
const getLocalBusinessPaymentSettingsMock = vi.fn<
  () => Promise<{
    businessId: string;
    businessSlug: string;
    businessName: string;
    mpConnected: boolean;
    mpCollectorId?: string | null;
    mpAccessToken?: string | null;
    mpRefreshToken?: string | null;
    mpTokenExpiresAt?: string | null;
  } | null>
>(async () => null);
const updateLocalBusinessMPTokensMock = vi.fn(async () => undefined);
const createPaymentPreferenceForBusinessMock = vi.fn(async () => ({
  ok: false as const,
  error: "business payment provider unavailable",
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.11" })),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

vi.mock("@/server/local-store", () => ({
  createLocalPublicBooking: createLocalPublicBookingMock,
  cancelLocalPublicBooking: cancelLocalPublicBookingMock,
  getLocalBusinessPaymentSettings: getLocalBusinessPaymentSettingsMock,
  updateLocalBusinessMPTokens: updateLocalBusinessMPTokensMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  createPocketBasePublicBooking: vi.fn(),
  reschedulePocketBasePublicBooking: vi.fn(),
  cancelPocketBasePublicBooking: vi.fn(),
  updatePocketBaseBusinessMPTokens: vi.fn(),
}));

vi.mock("@/server/analytics", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
}));

vi.mock("@/server/queries/public", () => ({
  getBookingConfirmationData: vi.fn(async () => null),
  getPublicBusinessPageData: vi.fn(async () => ({
    profile: { businessName: "Demo Barberia" },
    business: { name: "Demo Barberia", slug: "demo-barberia", mpConnected: false },
    services: [{ id: "service-1", name: "Corte", price: 500 }],
    features: { bookingMaxDaysAhead: 30, bookingLockMinutes: 10 },
  })),
}));

vi.mock("@/server/public-booking-links", () => ({
  isValidBookingManageToken: vi.fn(() => true),
}));

vi.mock("@/server/mercadopago", () => ({
  createPaymentPreferenceForBusiness: createPaymentPreferenceForBusinessMock,
  refreshMercadoPagoAccessToken: vi.fn(),
  isMercadoPagoConfiguredForBusiness: vi.fn((token?: string) => Boolean(token)),
}));

function buildBookingFormData() {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("serviceId", "service-1");
  formData.set("bookingDate", "2026-03-25");
  formData.set("startTime", "10:00");
  formData.set("fullName", "Cliente Test");
  formData.set("phone", "1133344455");
  formData.set("email", "cliente@example.com");
  formData.set("notes", "");
  formData.set("rescheduleBookingId", "");
  formData.set("manageToken", "");
  formData.set("source", "instagram");
  formData.set("medium", "social");
  formData.set("campaign", "promo-marzo");
  return formData;
}

describe("public booking action rate limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    createLocalPublicBookingMock.mockClear();
    cancelLocalPublicBookingMock.mockClear();
    getLocalBusinessPaymentSettingsMock.mockReset();
    updateLocalBusinessMPTokensMock.mockClear();
    createPaymentPreferenceForBusinessMock.mockReset();

    getLocalBusinessPaymentSettingsMock.mockResolvedValue(null);
    createPaymentPreferenceForBusinessMock.mockResolvedValue({
      ok: false,
      error: "business payment provider unavailable",
    });
  });

  it("shows a friendly throttle message after repeated submits", async () => {
    const { createPublicBookingAction } = await import("./public-booking");
    const redirectedUrls: string[] = [];

    for (let index = 0; index < 9; index += 1) {
      try {
        await createPublicBookingAction(buildBookingFormData());
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    expect(redirectedUrls[7]).toBe("/demo-barberia/confirmacion?booking=booking-test-id");
    const rateLimitedUrl = new URL(redirectedUrls[8] ?? "", "http://localhost");
    expect(rateLimitedUrl.pathname).toBe("/demo-barberia/reservar");
    expect(rateLimitedUrl.searchParams.get("error")).toContain("Demasiados intentos de reserva");
  });

  it("falls back to cash when the business has no Mercado Pago connected", async () => {
    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildBookingFormData())).rejects.toThrow(
      /REDIRECT:\/demo-barberia\/confirmacion\?booking=booking-test-id/
    );

    expect(createLocalPublicBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStatus: "confirmed",
      })
    );
    expect(createPaymentPreferenceForBusinessMock).not.toHaveBeenCalled();
    expect(cancelLocalPublicBookingMock).not.toHaveBeenCalled();
  });

  it("returns to booking and cancels the provisional booking when online payment init fails", async () => {
    getLocalBusinessPaymentSettingsMock.mockResolvedValue({
      businessId: "business-1",
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      mpConnected: true,
      mpCollectorId: "123456789",
      mpAccessToken: "APP_USR_test_token",
      mpRefreshToken: "refresh-token",
      mpTokenExpiresAt: null,
    });

    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildBookingFormData())).rejects.toThrow(
      /REDIRECT:\/demo-barberia\/reservar\?/
    );

    const redirectedUrl = String(redirectMock.mock.calls.at(-1)?.[0] ?? "");
    expect(createLocalPublicBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStatus: "pending_payment",
      })
    );
    expect(createPaymentPreferenceForBusinessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "booking-test-id",
        businessSlug: "demo-barberia",
        businessName: "Demo Barberia",
      }),
      "APP_USR_test_token"
    );
    expect(cancelLocalPublicBookingMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      bookingId: "booking-test-id",
    });
    expect(redirectedUrl).toContain(
      "error=No+pudimos+iniciar+el+pago+online.+Intenta+nuevamente+en+unos+minutos+o+contacta+al+negocio."
    );
  });
});
