import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getMPPaymentInfoMock,
  isValidMPWebhookSignatureMock,
  mapMPStatusToPaymentStatusMock,
  shouldVerifyMPWebhookSignatureMock,
  getSupabaseBusinessPaymentSettingsByCollectorIdMock,
  getSupabaseBookingPaymentValidationContextMock,
  getSupabaseBookingBusinessSlugMock,
  updateSupabaseBookingPaymentMock,
  updateSupabaseBookingPaymentIfStatusMock,
  updateSupabaseBusinessMPTokensMock,
  getSupabaseSubscriptionByBusinessIdMock,
  activateSupabaseSubscriptionMock,
  getSupabaseSubscriptionPaymentAttemptForWebhookMock,
  updateSupabaseSubscriptionPaymentAttemptStatusMock,
  getUsableBusinessMercadoPagoAccessTokenMock,
  sendBookingConfirmationEmailMock,
  sendBusinessNotificationEmailMock,
  getBookingConfirmationDataMock,
  getBlueDollarRateMock,
} = vi.hoisted(() => ({
  getMPPaymentInfoMock: vi.fn(),
  isValidMPWebhookSignatureMock: vi.fn(),
  mapMPStatusToPaymentStatusMock: vi.fn(),
  shouldVerifyMPWebhookSignatureMock: vi.fn(),
  getSupabaseBusinessPaymentSettingsByCollectorIdMock: vi.fn(),
  getSupabaseBookingPaymentValidationContextMock: vi.fn(),
  getSupabaseBookingBusinessSlugMock: vi.fn(),
  updateSupabaseBookingPaymentMock: vi.fn(),
  updateSupabaseBookingPaymentIfStatusMock: vi.fn(),
  updateSupabaseBusinessMPTokensMock: vi.fn(),
  getSupabaseSubscriptionByBusinessIdMock: vi.fn(),
  activateSupabaseSubscriptionMock: vi.fn(),
  getSupabaseSubscriptionPaymentAttemptForWebhookMock: vi.fn(),
  updateSupabaseSubscriptionPaymentAttemptStatusMock: vi.fn(),
  getUsableBusinessMercadoPagoAccessTokenMock: vi.fn(),
  sendBookingConfirmationEmailMock: vi.fn(),
  sendBusinessNotificationEmailMock: vi.fn(),
  getBookingConfirmationDataMock: vi.fn(),
  getBlueDollarRateMock: vi.fn(),
}));

vi.mock("@/server/mercadopago", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/mercadopago")>();
  return {
    ...original,
    getMPPaymentInfo: getMPPaymentInfoMock,
    isValidMPWebhookSignature: isValidMPWebhookSignatureMock,
    mapMPStatusToPaymentStatus: mapMPStatusToPaymentStatusMock,
    shouldVerifyMPWebhookSignature: shouldVerifyMPWebhookSignatureMock,
  };
});

vi.mock("@/server/supabase-store", () => ({
  getSupabaseBusinessPaymentSettingsByCollectorId: getSupabaseBusinessPaymentSettingsByCollectorIdMock,
  getSupabaseBookingPaymentValidationContext: getSupabaseBookingPaymentValidationContextMock,
  getSupabaseBookingBusinessSlug: getSupabaseBookingBusinessSlugMock,
  updateSupabaseBookingPayment: updateSupabaseBookingPaymentMock,
  updateSupabaseBookingPaymentIfStatus: updateSupabaseBookingPaymentIfStatusMock,
  updateSupabaseBusinessMPTokens: updateSupabaseBusinessMPTokensMock,
  getSupabaseSubscriptionByBusinessId: getSupabaseSubscriptionByBusinessIdMock,
  activateSupabaseSubscription: activateSupabaseSubscriptionMock,
  getSupabaseSubscriptionPaymentAttemptForWebhook: getSupabaseSubscriptionPaymentAttemptForWebhookMock,
  updateSupabaseSubscriptionPaymentAttemptStatus: updateSupabaseSubscriptionPaymentAttemptStatusMock,
}));

vi.mock("@/server/mercadopago-business-auth", () => ({
  getUsableBusinessMercadoPagoAccessToken: getUsableBusinessMercadoPagoAccessTokenMock,
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: sendBookingConfirmationEmailMock,
  sendBusinessNotificationEmail: sendBusinessNotificationEmailMock,
}));

vi.mock("@/server/queries/public", () => ({
  getBookingConfirmationData: getBookingConfirmationDataMock,
}));

vi.mock("@/lib/dollar-rate", () => ({
  getBlueDollarRate: getBlueDollarRateMock,
}));

describe("mercadopago webhook route", () => {
  beforeEach(() => {
    vi.resetModules();
    getMPPaymentInfoMock.mockReset();
    isValidMPWebhookSignatureMock.mockReset();
    mapMPStatusToPaymentStatusMock.mockReset();
    shouldVerifyMPWebhookSignatureMock.mockReset();
    getSupabaseBusinessPaymentSettingsByCollectorIdMock.mockReset();
    getSupabaseBookingPaymentValidationContextMock.mockReset();
    getSupabaseBookingBusinessSlugMock.mockReset();
    updateSupabaseBookingPaymentMock.mockReset();
    updateSupabaseBookingPaymentIfStatusMock.mockReset();
    updateSupabaseBusinessMPTokensMock.mockReset();
    getSupabaseSubscriptionByBusinessIdMock.mockReset();
    activateSupabaseSubscriptionMock.mockReset();
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockReset();
    updateSupabaseSubscriptionPaymentAttemptStatusMock.mockReset();
    getUsableBusinessMercadoPagoAccessTokenMock.mockReset();
    sendBookingConfirmationEmailMock.mockReset();
    sendBusinessNotificationEmailMock.mockReset();
    getBookingConfirmationDataMock.mockReset();
    getBlueDollarRateMock.mockReset();

    shouldVerifyMPWebhookSignatureMock.mockReturnValue(false);
    mapMPStatusToPaymentStatusMock.mockImplementation((status: string) =>
      status === "approved" ? "approved" : "pending"
    );
    getSupabaseBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue(null);
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue(null);
    updateSupabaseSubscriptionPaymentAttemptStatusMock.mockResolvedValue({ id: "attempt-1" });
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue({
      bookingId: "booking-1",
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      status: "pending_payment",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentPreferenceId: "pref-1",
      paymentExternalId: undefined,
      mpCollectorId: "collector-1",
    });
    getUsableBusinessMercadoPagoAccessTokenMock.mockResolvedValue(null);
    getBlueDollarRateMock.mockResolvedValue(1000);
    updateSupabaseBookingPaymentIfStatusMock.mockResolvedValue(true);
  });

  it("returns webhook health info on GET", async () => {
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, service: "mercadopago-webhook" });
  });

  it("skips non-payment events", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "topic", action: "test" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(getMPPaymentInfoMock).not.toHaveBeenCalled();
  });

  it("skips payment events without a payment id", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: {} }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(getMPPaymentInfoMock).not.toHaveBeenCalled();
  });

  it("returns 401 when signature verification fails", async () => {
    shouldVerifyMPWebhookSignatureMock.mockReturnValue(true);
    isValidMPWebhookSignatureMock.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": "req-123",
          "x-signature": "ts=123,v1=bad",
        },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "Invalid webhook signature" });
  });

  it("returns 400 when the payload fails Zod validation", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: "invalid" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ ok: false, error: "Invalid webhook payload" });
    expect(getMPPaymentInfoMock).not.toHaveBeenCalled();
  });

  it("returns ok when Mercado Pago payment info cannot be retrieved", async () => {
    getMPPaymentInfoMock.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("returns ok when payment has no external reference", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("updates booking payment and sends confirmation email when approved", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    getSupabaseBookingBusinessSlugMock.mockResolvedValue("demo-barberia");
    getBookingConfirmationDataMock.mockResolvedValue({ bookingId: "booking-1" });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(updateSupabaseBookingPaymentIfStatusMock).toHaveBeenCalledWith({
      bookingId: "booking-1",
      paymentStatus: "approved",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentExternalId: "pay-1",
      expectedCurrentStatus: "pending_payment",
    });
    expect(getBookingConfirmationDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      bookingId: "booking-1",
      skipTokenValidation: true,
    });
    expect(sendBookingConfirmationEmailMock).toHaveBeenCalledWith({ bookingId: "booking-1" }, "created");
  });

  it("retries when the booking is not yet linked to the MP preference, then succeeds", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    getSupabaseBookingBusinessSlugMock.mockResolvedValue("demo-barberia");
    getBookingConfirmationDataMock.mockResolvedValue({ bookingId: "booking-1" });
    // First read races the public-booking action's write: paymentPreferenceId isn't
    // persisted yet. Second read (after the retry delay) finds it already prepared.
    getSupabaseBookingPaymentValidationContextMock
      .mockResolvedValueOnce({
        bookingId: "booking-1",
        businessId: "biz-1",
        businessSlug: "demo-barberia",
        status: "pending_payment",
        paymentAmount: 18000,
        paymentCurrency: "ARS",
        paymentProvider: undefined,
        paymentPreferenceId: undefined,
        paymentExternalId: undefined,
        mpCollectorId: "collector-1",
      })
      .mockResolvedValueOnce({
        bookingId: "booking-1",
        businessId: "biz-1",
        businessSlug: "demo-barberia",
        status: "pending_payment",
        paymentAmount: 18000,
        paymentCurrency: "ARS",
        paymentProvider: "mercadopago",
        paymentPreferenceId: "pref-1",
        paymentExternalId: undefined,
        mpCollectorId: "collector-1",
      });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(getSupabaseBookingPaymentValidationContextMock).toHaveBeenCalledTimes(2);
    expect(updateSupabaseBookingPaymentIfStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "booking-1", expectedCurrentStatus: "pending_payment" })
    );
    expect(sendBookingConfirmationEmailMock).toHaveBeenCalledWith({ bookingId: "booking-1" }, "created");
  });

  it("gives up after retrying and skips when the booking never gets linked to the MP preference", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue({
      bookingId: "booking-1",
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      status: "pending_payment",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: undefined,
      paymentPreferenceId: undefined,
      paymentExternalId: undefined,
      mpCollectorId: "collector-1",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(getSupabaseBookingPaymentValidationContextMock).toHaveBeenCalledTimes(4);
    expect(updateSupabaseBookingPaymentIfStatusMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationEmailMock).not.toHaveBeenCalled();
  }, 10000);

  it("does not resend confirmations when an approved payment was already processed", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue({
      bookingId: "booking-1",
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      status: "confirmed",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentPreferenceId: "pref-1",
      paymentExternalId: "pay-1",
      paymentStatus: "approved",
      mpCollectorId: "collector-1",
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
      collectorId: "collector-1",
    });
    // Simulates the real conditional update finding the row no longer "pending_payment"
    // (already flipped by a prior delivery) and affecting 0 rows.
    updateSupabaseBookingPaymentIfStatusMock.mockResolvedValue(false);

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" }, user_id: "collector-1" }),
      })
    );

    expect(response.status).toBe(200);
    expect(updateSupabaseBookingPaymentIfStatusMock).toHaveBeenCalledWith({
      bookingId: "booking-1",
      paymentStatus: "approved",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentExternalId: "pay-1",
      expectedCurrentStatus: "pending_payment",
    });
    expect(getSupabaseBookingBusinessSlugMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationEmailMock).not.toHaveBeenCalled();
    expect(sendBusinessNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("only runs approved side effects once when two webhook deliveries race", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    getSupabaseBookingBusinessSlugMock.mockResolvedValue("demo-barberia");
    getBookingConfirmationDataMock.mockResolvedValue({ bookingId: "booking-1" });
    // First delivery wins the conditional update (row still pending_payment); the
    // second (duplicate/concurrent) delivery finds it already flipped.
    updateSupabaseBookingPaymentIfStatusMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const { POST } = await import("./route");

    const makeRequest = () =>
      POST(
        new Request("http://localhost/api/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
        })
      );

    const [firstResponse, secondResponse] = await Promise.all([makeRequest(), makeRequest()]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(updateSupabaseBookingPaymentIfStatusMock).toHaveBeenCalledTimes(2);
    expect(sendBookingConfirmationEmailMock).toHaveBeenCalledTimes(1);
  });

  it("ignores approved payments when the amount does not match the booking", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 99999,
      currencyId: "ARS",
      collectorId: "collector-1",
      metadata: { bookingId: "booking-1", businessSlug: "demo-barberia" },
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" }, user_id: "collector-1" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
    expect(sendBookingConfirmationEmailMock).not.toHaveBeenCalled();
  });

  it("ignores approved payments when the collector belongs to another business", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
      collectorId: "collector-2",
      metadata: { bookingId: "booking-1", businessSlug: "demo-barberia" },
    });
    getSupabaseBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue({
      businessId: "biz-otro",
      businessSlug: "otro-negocio",
      businessName: "Otro Negocio",
      mpConnected: true,
      mpCollectorId: "collector-2",
      mpAccessToken: "token-2",
      mpRefreshToken: "refresh-2",
      mpTokenExpiresAt: null,
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" }, user_id: "collector-2" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("activates a valid subscription payment when no booking matches", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue({
      id: "sub-1",
      status: "trial",
      businessId: "biz-1",
    });
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue({
      id: "attempt-1",
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
      amountArs: 17000,
      currency: "ARS",
      blueRate: 1000,
      status: "pending",
      paymentId: null,
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 17000,
      currencyId: "ARS",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );

    expect(response.status).toBe(200);
    expect(getSupabaseSubscriptionPaymentAttemptForWebhookMock).toHaveBeenCalledWith({
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
    });
    expect(activateSupabaseSubscriptionMock).toHaveBeenCalledWith("biz-1");
    expect(updateSupabaseSubscriptionPaymentAttemptStatusMock).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      status: "approved",
      paymentId: "pay-sub-1",
    });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("does not activate a subscription when the amount does not match the stored attempt", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue({
      id: "sub-1",
      status: "trial",
      businessId: "biz-1",
    });
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue({
      id: "attempt-1",
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
      amountArs: 17000,
      currency: "ARS",
      blueRate: 1000,
      status: "pending",
      paymentId: null,
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 9999,
      currencyId: "ARS",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(activateSupabaseSubscriptionMock).not.toHaveBeenCalled();
    expect(updateSupabaseSubscriptionPaymentAttemptStatusMock).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      status: "rejected",
      paymentId: "pay-sub-1",
    });
  });

  it("does not activate a subscription when the currency does not match", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue({
      id: "sub-1",
      status: "trial",
      businessId: "biz-1",
    });
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue({
      id: "attempt-1",
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
      amountArs: 17000,
      currency: "ARS",
      blueRate: 1000,
      status: "pending",
      paymentId: null,
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 17000,
      currencyId: "USD",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(activateSupabaseSubscriptionMock).not.toHaveBeenCalled();
    expect(updateSupabaseSubscriptionPaymentAttemptStatusMock).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      status: "rejected",
      paymentId: "pay-sub-1",
    });
  });

  it("does not activate a subscription when no stored attempt exists", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue(null);
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 17000,
      currencyId: "ARS",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(activateSupabaseSubscriptionMock).not.toHaveBeenCalled();
    expect(updateSupabaseSubscriptionPaymentAttemptStatusMock).not.toHaveBeenCalled();
  });

  it("does not activate a subscription when it does not exist", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue(null);
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue({
      id: "attempt-1",
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
      amountArs: 17000,
      currency: "ARS",
      blueRate: 1000,
      status: "pending",
      paymentId: null,
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 17000,
      currencyId: "ARS",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(activateSupabaseSubscriptionMock).not.toHaveBeenCalled();
  });

  it("does not reactivate an already active subscription", async () => {
    getSupabaseBookingPaymentValidationContextMock.mockResolvedValue(null);
    getSupabaseSubscriptionByBusinessIdMock.mockResolvedValue({
      id: "sub-1",
      status: "active",
      businessId: "biz-1",
    });
    getSupabaseSubscriptionPaymentAttemptForWebhookMock.mockResolvedValue({
      id: "attempt-1",
      businessId: "biz-1",
      preferenceId: "pref-sub-1",
      amountArs: 17000,
      currency: "ARS",
      blueRate: 1000,
      status: "pending",
      paymentId: null,
    });
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      preferenceId: "pref-sub-1",
      transactionAmount: 17000,
      currencyId: "ARS",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, skipped: true });
    expect(activateSupabaseSubscriptionMock).not.toHaveBeenCalled();
  });

  it("returns 401 when MP_WEBHOOK_SECRET is not configured in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    shouldVerifyMPWebhookSignatureMock.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    vi.unstubAllEnvs();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "Webhook signature required" });
    expect(getMPPaymentInfoMock).not.toHaveBeenCalled();
  });

  it("returns 500 when an internal error occurs during payment processing", async () => {
    getMPPaymentInfoMock.mockRejectedValue(new Error("DB connection failed"));
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "Internal error" });
    expect(updateSupabaseBookingPaymentMock).not.toHaveBeenCalled();
  });
});
