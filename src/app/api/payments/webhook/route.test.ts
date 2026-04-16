import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isPocketBaseConfiguredMock,
  getMPPaymentInfoMock,
  isValidMPWebhookSignatureMock,
  mapMPStatusToPaymentStatusMock,
  shouldVerifyMPWebhookSignatureMock,
  getLocalBusinessPaymentSettingsByCollectorIdMock,
  getLocalBookingPaymentValidationContextMock,
  getLocalBookingBusinessSlugMock,
  updateLocalBookingPaymentMock,
  updateLocalBusinessMPTokensMock,
  getUsableBusinessMercadoPagoAccessTokenMock,
  getBusinessSubscriptionMock,
  getPocketBaseBookingPaymentValidationContextMock,
  getPocketBaseBookingBusinessSlugMock,
  getPocketBaseBusinessPaymentSettingsByCollectorIdMock,
  updatePocketBaseBookingPaymentMock,
  updatePocketBaseBusinessMPTokensMock,
  sendBookingConfirmationEmailMock,
  getBookingConfirmationDataMock,
} = vi.hoisted(() => ({
  isPocketBaseConfiguredMock: vi.fn(),
  getMPPaymentInfoMock: vi.fn(),
  isValidMPWebhookSignatureMock: vi.fn(),
  mapMPStatusToPaymentStatusMock: vi.fn(),
    shouldVerifyMPWebhookSignatureMock: vi.fn(),
    getLocalBusinessPaymentSettingsByCollectorIdMock: vi.fn(),
    getLocalBookingPaymentValidationContextMock: vi.fn(),
    getLocalBookingBusinessSlugMock: vi.fn(),
    updateLocalBookingPaymentMock: vi.fn(),
  updateLocalBusinessMPTokensMock: vi.fn(),
    getUsableBusinessMercadoPagoAccessTokenMock: vi.fn(),
    getBusinessSubscriptionMock: vi.fn(),
    getPocketBaseBookingPaymentValidationContextMock: vi.fn(),
    getPocketBaseBookingBusinessSlugMock: vi.fn(),
  getPocketBaseBusinessPaymentSettingsByCollectorIdMock: vi.fn(),
  updatePocketBaseBookingPaymentMock: vi.fn(),
  updatePocketBaseBusinessMPTokensMock: vi.fn(),
  sendBookingConfirmationEmailMock: vi.fn(),
  getBookingConfirmationDataMock: vi.fn(),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/server/mercadopago", () => ({
  getMPPaymentInfo: getMPPaymentInfoMock,
  isValidMPWebhookSignature: isValidMPWebhookSignatureMock,
  mapMPStatusToPaymentStatus: mapMPStatusToPaymentStatusMock,
  shouldVerifyMPWebhookSignature: shouldVerifyMPWebhookSignatureMock,
}));

vi.mock("@/server/local-store", () => ({
  getLocalBusinessPaymentSettingsByCollectorId: getLocalBusinessPaymentSettingsByCollectorIdMock,
  getLocalBookingPaymentValidationContext: getLocalBookingPaymentValidationContextMock,
  getLocalBookingBusinessSlug: getLocalBookingBusinessSlugMock,
  updateLocalBookingPayment: updateLocalBookingPaymentMock,
  updateLocalBusinessMPTokens: updateLocalBusinessMPTokensMock,
}));

vi.mock("@/server/mercadopago-business-auth", () => ({
  getUsableBusinessMercadoPagoAccessToken: getUsableBusinessMercadoPagoAccessTokenMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  getBusinessSubscription: getBusinessSubscriptionMock,
  getPocketBaseBookingPaymentValidationContext: getPocketBaseBookingPaymentValidationContextMock,
  getPocketBaseBookingBusinessSlug: getPocketBaseBookingBusinessSlugMock,
  getPocketBaseBusinessPaymentSettingsByCollectorId: getPocketBaseBusinessPaymentSettingsByCollectorIdMock,
  updatePocketBaseBookingPayment: updatePocketBaseBookingPaymentMock,
  updatePocketBaseBusinessMPTokens: updatePocketBaseBusinessMPTokensMock,
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: sendBookingConfirmationEmailMock,
}));

vi.mock("@/server/queries/public", () => ({
  getBookingConfirmationData: getBookingConfirmationDataMock,
}));

describe("mercadopago webhook route", () => {
  beforeEach(() => {
    vi.resetModules();
    isPocketBaseConfiguredMock.mockReset();
    getMPPaymentInfoMock.mockReset();
    isValidMPWebhookSignatureMock.mockReset();
    mapMPStatusToPaymentStatusMock.mockReset();
    shouldVerifyMPWebhookSignatureMock.mockReset();
    getLocalBusinessPaymentSettingsByCollectorIdMock.mockReset();
    getLocalBookingPaymentValidationContextMock.mockReset();
    getLocalBookingBusinessSlugMock.mockReset();
    updateLocalBookingPaymentMock.mockReset();
    updateLocalBusinessMPTokensMock.mockReset();
    getUsableBusinessMercadoPagoAccessTokenMock.mockReset();
    getBusinessSubscriptionMock.mockReset();
    getPocketBaseBookingPaymentValidationContextMock.mockReset();
    getPocketBaseBookingBusinessSlugMock.mockReset();
    getPocketBaseBusinessPaymentSettingsByCollectorIdMock.mockReset();
    updatePocketBaseBookingPaymentMock.mockReset();
    updatePocketBaseBusinessMPTokensMock.mockReset();
    sendBookingConfirmationEmailMock.mockReset();
    getBookingConfirmationDataMock.mockReset();

    isPocketBaseConfiguredMock.mockReturnValue(false);
    shouldVerifyMPWebhookSignatureMock.mockReturnValue(false);
    mapMPStatusToPaymentStatusMock.mockImplementation((status: string) =>
      status === "approved" ? "approved" : "pending"
    );
    getBusinessSubscriptionMock.mockResolvedValue(null);
    getLocalBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue(null);
    getLocalBookingPaymentValidationContextMock.mockResolvedValue({
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
    getPocketBaseBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue(null);
    getPocketBaseBookingPaymentValidationContextMock.mockResolvedValue({
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
    expect(updateLocalBookingPaymentMock).not.toHaveBeenCalled();
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
    expect(updateLocalBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("updates local booking payment and sends confirmation email when approved", async () => {
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "booking-1",
      transactionAmount: 18000,
      currencyId: "ARS",
    });
    getLocalBookingBusinessSlugMock.mockResolvedValue("demo-barberia");
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
    expect(updateLocalBookingPaymentMock).toHaveBeenCalledWith({
      bookingId: "booking-1",
      paymentStatus: "approved",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentExternalId: "pay-1",
    });
    expect(getBookingConfirmationDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      bookingId: "booking-1",
      skipTokenValidation: true,
    });
    expect(sendBookingConfirmationEmailMock).toHaveBeenCalledWith({ bookingId: "booking-1" }, "created");
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
    expect(updateLocalBookingPaymentMock).not.toHaveBeenCalled();
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
    getLocalBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue({
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
    expect(updateLocalBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("returns 500 when MP_WEBHOOK_SECRET is not configured in production", async () => {
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
    expect(updateLocalBookingPaymentMock).not.toHaveBeenCalled();
  });

  it("activates PocketBase subscriptions on approved subscription payments", async () => {
    const subscriptionUpdateMock = vi.fn().mockResolvedValue(undefined);
    isPocketBaseConfiguredMock.mockReturnValue(true);
    shouldVerifyMPWebhookSignatureMock.mockReturnValue(true);
    isValidMPWebhookSignatureMock.mockReturnValue(true);
    getPocketBaseBusinessPaymentSettingsByCollectorIdMock.mockResolvedValue({
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      mpAccessToken: "token-1",
      mpRefreshToken: "refresh-1",
      mpCollectorId: "collector-1",
      mpTokenExpiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    getUsableBusinessMercadoPagoAccessTokenMock.mockResolvedValue("token-1");
    getMPPaymentInfoMock.mockResolvedValue({
      id: "pay-sub-1",
      status: "approved",
      statusDetail: "accredited",
      externalReference: "biz-1",
      transactionAmount: 9990,
      currencyId: "ARS",
    });
    getBusinessSubscriptionMock.mockResolvedValue({
      id: "sub-1",
      update: subscriptionUpdateMock,
    });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/payments/webhook?type=payment&user_id=collector-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment.updated", data: { id: "pay-sub-1" } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(getUsableBusinessMercadoPagoAccessTokenMock).toHaveBeenCalled();
    expect(getMPPaymentInfoMock).toHaveBeenCalledWith("pay-sub-1", "token-1");
    expect(subscriptionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        trialEndsAt: null,
      })
    );
    expect(updatePocketBaseBookingPaymentMock).not.toHaveBeenCalled();
  });
});
