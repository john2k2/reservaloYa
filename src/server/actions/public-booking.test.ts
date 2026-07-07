import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const createSupabasePublicBookingMock = vi.fn(async () => "booking-test-id");
const cancelSupabasePublicBookingMock = vi.fn(async () => "booking-test-id");
const rescheduleSupabasePublicBookingMock = vi.fn(async () => "booking-test-id");
const updateSupabaseBookingPaymentMock = vi.fn(async () => undefined);
const getSupabaseBusinessPaymentSettingsBySlugMock = vi.fn<
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
const updateSupabaseBusinessMPTokensMock = vi.fn(async () => undefined);
const createPaymentPreferenceForBusinessMock = vi.fn(async () => ({
  ok: false as const,
  error: "business payment provider unavailable",
}));
const sendBookingConfirmationEmailMock = vi.fn<
  () => Promise<{ status: "sent"; messageId: string } | { status: "skipped"; reason: string } | { status: "error"; error: string }>
>(async () => ({ status: "skipped", reason: "no_customer_email" }));
const getBookingConfirmationDataMock = vi.fn<() => Promise<Record<string, unknown> | null>>(async () => null);
// _core is transitively imported by the static `@/server/rate-limit` import above,
// so its mock factory runs before ordinary top-level consts would be initialized —
// vi.hoisted() makes these survive that early evaluation.
const { communicationEventsInsertMock, bookingsSingleMock, getSupabaseAdminClientMock } = vi.hoisted(() => {
  const communicationEventsInsertMock = vi.fn(async () => ({ data: null, error: null }));
  const bookingsSingleMock = vi.fn(async () => ({ data: { customer_id: "customer-1" }, error: null }));
  const getSupabaseAdminClientMock = vi.fn(async () => ({
    from(table: string) {
      if (table === "bookings") {
        return {
          select: () => ({
            eq: () => ({
              single: bookingsSingleMock,
            }),
          }),
        };
      }
      if (table === "communication_events") {
        return { insert: communicationEventsInsertMock };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    },
  }));
  return { communicationEventsInsertMock, bookingsSingleMock, getSupabaseAdminClientMock };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.11" })),
}));

vi.mock("@/server/supabase-store", () => ({
  createSupabasePublicBooking: createSupabasePublicBookingMock,
  cancelSupabasePublicBooking: cancelSupabasePublicBookingMock,
  rescheduleSupabasePublicBooking: rescheduleSupabasePublicBookingMock,
  updateSupabaseBookingPayment: updateSupabaseBookingPaymentMock,
  getSupabaseBusinessPaymentSettingsBySlug: getSupabaseBusinessPaymentSettingsBySlugMock,
  updateSupabaseBusinessMPTokens: updateSupabaseBusinessMPTokensMock,
}));

vi.mock("@/server/analytics", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: sendBookingConfirmationEmailMock,
}));

vi.mock("@/server/supabase-store/_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

vi.mock("@/server/queries/public", () => ({
  getBookingConfirmationData: getBookingConfirmationDataMock,
  getPublicBusinessPageData: vi.fn(async () => ({
    profile: { businessName: "Demo Barberia" },
    business: { name: "Demo Barberia", slug: "demo-barberia", mpConnected: false },
    services: [{ id: "service-1", name: "Corte", price: 500 }],
    features: { bookingMaxDaysAhead: 30, bookingLockMinutes: 10 },
  })),
}));

vi.mock("@/server/public-booking-links", () => ({
  buildBookingConfirmationHref: vi.fn(
    (slug: string, bookingId: string) => `/${slug}/confirmacion?booking=${bookingId}&token=confirmation-token`
  ),
  isValidBookingManageToken: vi.fn(() => true),
}));

vi.mock("@/server/mercadopago", () => ({
  createPaymentPreferenceForBusiness: createPaymentPreferenceForBusinessMock,
  refreshMercadoPagoAccessToken: vi.fn(),
  isMercadoPagoConfiguredForBusiness: vi.fn((token?: string) => Boolean(token)),
}));

/** Fecha futura fija para tests: un año desde hoy, primer día del mes. */
function futureDateString(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

const TEST_BOOKING_DATE = futureDateString();

function buildBookingFormData() {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("serviceId", "service-1");
  formData.set("bookingDate", TEST_BOOKING_DATE);
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

const VALID_MANAGE_TOKEN = "a".repeat(32);

function buildRescheduleFormData(overrides: Record<string, string> = {}) {
  const formData = buildBookingFormData();
  formData.set("rescheduleBookingId", "existing-booking-id");
  formData.set("manageToken", VALID_MANAGE_TOKEN);
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

const sharedBeforeEach = () => {
  resetRateLimitStoreForTests();
  redirectMock.mockClear();
  createSupabasePublicBookingMock.mockClear();
  cancelSupabasePublicBookingMock.mockClear();
  rescheduleSupabasePublicBookingMock.mockClear();
  updateSupabaseBookingPaymentMock.mockClear();
  getSupabaseBusinessPaymentSettingsBySlugMock.mockReset();
  updateSupabaseBusinessMPTokensMock.mockClear();
  createPaymentPreferenceForBusinessMock.mockReset();
  sendBookingConfirmationEmailMock.mockReset();
  getBookingConfirmationDataMock.mockReset();
  communicationEventsInsertMock.mockClear();
  bookingsSingleMock.mockClear();

  getSupabaseBusinessPaymentSettingsBySlugMock.mockResolvedValue(null);
  createPaymentPreferenceForBusinessMock.mockResolvedValue({
    ok: false,
    error: "business payment provider unavailable",
  });
  sendBookingConfirmationEmailMock.mockResolvedValue({ status: "skipped", reason: "no_customer_email" });
  getBookingConfirmationDataMock.mockResolvedValue(null);
};

describe("public booking action rate limit", () => {
  beforeEach(sharedBeforeEach);

  it("shows a friendly throttle message after repeated submits with the same email", async () => {
    const { createPublicBookingAction } = await import("./public-booking");
    const redirectedUrls: string[] = [];

    // Identical email + date/time on every submit trips the per-email bucket
    // (max 5) before the looser per-IP+business bucket (max 8).
    for (let index = 0; index < 6; index += 1) {
      try {
        await createPublicBookingAction(buildBookingFormData());
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    expect(redirectedUrls[4]).toBe(
      "/demo-barberia/confirmacion?booking=booking-test-id&token=confirmation-token"
    );
    const rateLimitedUrl = new URL(redirectedUrls[5] ?? "", "http://localhost");
    expect(rateLimitedUrl.pathname).toBe("/demo-barberia/reservar");
    expect(rateLimitedUrl.searchParams.get("error")).toContain("Demasiados intentos de reserva");
  });

  it("still throttles by IP+business even when the email is rotated on every submit", async () => {
    const { createPublicBookingAction } = await import("./public-booking");
    const redirectedUrls: string[] = [];

    for (let index = 0; index < 9; index += 1) {
      const formData = buildBookingFormData();
      formData.set("email", `attacker-${index}@example.com`);
      try {
        await createPublicBookingAction(formData);
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    const rateLimitedUrl = new URL(redirectedUrls[8] ?? "", "http://localhost");
    expect(rateLimitedUrl.pathname).toBe("/demo-barberia/reservar");
    expect(rateLimitedUrl.searchParams.get("error")).toContain("Demasiados intentos de reserva");
  });

  it("throttles the same email across different dates/times (closes email-bombing)", async () => {
    const { createPublicBookingAction } = await import("./public-booking");
    const redirectedUrls: string[] = [];

    for (let index = 0; index < 6; index += 1) {
      const formData = buildBookingFormData();
      formData.set("startTime", `1${index}:00`);
      try {
        await createPublicBookingAction(formData);
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    const rateLimitedUrl = new URL(redirectedUrls[5] ?? "", "http://localhost");
    expect(rateLimitedUrl.pathname).toBe("/demo-barberia/reservar");
    expect(rateLimitedUrl.searchParams.get("error")).toContain("Demasiados intentos de reserva con este email");
  });

  it("falls back to cash when the business has no Mercado Pago connected", async () => {
    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildBookingFormData())).rejects.toThrow(
      /REDIRECT:\/demo-barberia\/confirmacion\?booking=booking-test-id&token=confirmation-token/
    );

    expect(createSupabasePublicBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStatus: "confirmed",
      })
    );
    expect(createPaymentPreferenceForBusinessMock).not.toHaveBeenCalled();
    expect(cancelSupabasePublicBookingMock).not.toHaveBeenCalled();
  });

  it("returns to booking and cancels the provisional booking when online payment init fails", async () => {
    getSupabaseBusinessPaymentSettingsBySlugMock.mockResolvedValue({
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
    expect(createSupabasePublicBookingMock).toHaveBeenCalledWith(
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
    expect(cancelSupabasePublicBookingMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      bookingId: "booking-test-id",
    });
    expect(redirectedUrl).toContain(
      "error=No+pudimos+iniciar+el+pago+online.+Intenta+nuevamente+en+unos+minutos+o+contacta+al+negocio."
    );
  });
});

describe("confirmation email outcome recording", () => {
  beforeEach(sharedBeforeEach);

  it("records a sent communication_events row after a successful confirmation email", async () => {
    getBookingConfirmationDataMock.mockResolvedValue({
      businessId: "business-1",
      businessNotificationEmail: null,
    });
    sendBookingConfirmationEmailMock.mockResolvedValue({ status: "sent", messageId: "msg-1" });

    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildBookingFormData())).rejects.toThrow(/REDIRECT:/);

    expect(communicationEventsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "business-1",
        booking_id: "booking-test-id",
        customer_id: "customer-1",
        channel: "email",
        kind: "confirmation",
        status: "sent",
        recipient: "cliente@example.com",
      })
    );
  });

  it("records a failed communication_events row when the confirmation email errors", async () => {
    getBookingConfirmationDataMock.mockResolvedValue({
      businessId: "business-1",
      businessNotificationEmail: null,
    });
    sendBookingConfirmationEmailMock.mockResolvedValue({ status: "error", error: "resend_down" });

    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildBookingFormData())).rejects.toThrow(/REDIRECT:/);

    expect(communicationEventsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        note: "resend_down",
      })
    );
  });
});

describe("reschedule booking", () => {
  beforeEach(sharedBeforeEach);

  it("reschedula correctamente en el store", async () => {
    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildRescheduleFormData())).rejects.toThrow(
      /REDIRECT:\/demo-barberia\/confirmacion\?booking=booking-test-id&token=confirmation-token/
    );

    expect(rescheduleSupabasePublicBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rescheduleBookingId: "existing-booking-id",
        businessSlug: "demo-barberia",
        bookingDate: TEST_BOOKING_DATE,
        startTime: "10:00",
      })
    );
  });

  it("no intenta cobro online en un reschedule", async () => {
    // Simular que el negocio tiene MP conectado — no debería importar en un reschedule
    getSupabaseBusinessPaymentSettingsBySlugMock.mockResolvedValue({
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

    await expect(createPublicBookingAction(buildRescheduleFormData())).rejects.toThrow(
      /REDIRECT:\/demo-barberia\/confirmacion\?booking=booking-test-id&token=confirmation-token/
    );

    expect(createPaymentPreferenceForBusinessMock).not.toHaveBeenCalled();
  });

  it("rechaza reschedule con token inválido", async () => {
    const { isValidBookingManageToken } = await import("@/server/public-booking-links");
    vi.mocked(isValidBookingManageToken).mockReturnValueOnce(false);

    const { createPublicBookingAction } = await import("./public-booking");

    await expect(createPublicBookingAction(buildRescheduleFormData())).rejects.toThrow(/REDIRECT:/);

    const redirectedUrl = String(redirectMock.mock.calls.at(-1)?.[0] ?? "");
    const url = new URL(redirectedUrl, "http://localhost");
    expect(url.pathname).toBe("/demo-barberia/reservar");
    expect(url.searchParams.get("error")).toContain("Link de gestion invalido");
    expect(rescheduleSupabasePublicBookingMock).not.toHaveBeenCalled();
  });
});
