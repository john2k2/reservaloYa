import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmation = {
  businessName: "Demo Barberia",
  businessAddress: "Av. del Libertador 214, Palermo",
  businessTimezone: "America/Argentina/Buenos_Aires",
  bookingDate: "2026-03-11",
  startTime: "09:00",
  serviceName: "Afeitado clasico",
  durationMinutes: 35,
};

describe("booking notifications", () => {
  const envBackup = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env = { ...envBackup };
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllGlobals();
  });

  it("detects available reminder channels when providers are configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "auth";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    process.env.TWILIO_WHATSAPP_TEMPLATE_SID = "HX123";

    const { getAvailableReminderChannels } = await import("./booking-notifications");

    expect(
      getAvailableReminderChannels({
        customerEmail: "cliente@example.com",
        customerPhone: "+5491155550101",
      })
    ).toEqual(["email", "whatsapp"]);
  });

  it("sends confirmation email through Resend when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "ReservaYa <hola@reservaya.app>";
    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya-kappa.vercel.app";
    process.env.BOOKING_LINK_SECRET = "booking-links-secret";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });

    const { sendBookingConfirmationEmail } = await import("./booking-notifications");

    const result = await sendBookingConfirmationEmail({
      ...confirmation,
      bookingId: "booking_123",
      confirmationCode: "ABC123",
      customerName: "Cliente QA",
      customerEmail: "cliente@example.com",
      customerPhone: "+5491112345678",
      businessId: "business_123",
      businessSlug: "demo-barberia",
      businessNotificationEmail: "negocio@example.com",
      serviceId: "service_123",
      priceAmount: 5500,
      currency: "ARS",
      startsAt: "2026-03-11T09:00:00.000Z",
      timezone: "America/Argentina/Buenos_Aires",
      status: "confirmed",
    }, "created");

    expect(result.status).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test",
        }),
      })
    );
  });

  it("sends WhatsApp reminder through Twilio when configured", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya-kappa.vercel.app";
    process.env.BOOKING_LINK_SECRET = "booking-links-secret";
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "auth";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    process.env.TWILIO_WHATSAPP_TEMPLATE_SID = "HX123";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ sid: "SM123" }),
    });

    const { sendBookingReminderWhatsApp } = await import("./booking-notifications");

    const result = await sendBookingReminderWhatsApp({
      bookingId: "booking_123",
      businessSlug: "demo-barberia",
      customerName: "Cliente QA",
      customerPhone: "+5491155550101",
      confirmation,
    });

    expect(result.status).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips reminder email when customer has no email", async () => {
    const { sendBookingReminderEmail } = await import("./booking-notifications");
    const result = await sendBookingReminderEmail({
      bookingId: "b-1",
      businessSlug: "demo-barberia",
      customerName: "Cliente",
      customerEmail: undefined,
      customerPhone: "+5491155550101",
      confirmation,
    });
    expect(result.status).toBe("skipped");
  });

  it("sends reminder email when Resend is configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "turnos@reservaya.ar";
    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.ar";
    process.env.BOOKING_LINK_SECRET = "booking-links-secret";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_456" }),
    });

    const { sendBookingReminderEmail } = await import("./booking-notifications");
    const result = await sendBookingReminderEmail({
      bookingId: "b-1",
      businessSlug: "demo-barberia",
      customerName: "Cliente QA",
      customerEmail: "cliente@example.com",
      customerPhone: "+5491155550101",
      confirmation,
    });
    expect(result.status).toBe("sent");
  });

  it("skips WhatsApp reminder when customer has no phone", async () => {
    const { sendBookingReminderWhatsApp } = await import("./booking-notifications");
    const result = await sendBookingReminderWhatsApp({
      bookingId: "b-1",
      businessSlug: "demo-barberia",
      customerName: "Cliente",
      customerEmail: "a@b.com",
      customerPhone: undefined,
      confirmation,
    });
    expect(result.status).toBe("skipped");
  });

  it("skips WhatsApp reminder when Twilio is not configured", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    const { sendBookingReminderWhatsApp } = await import("./booking-notifications");
    const result = await sendBookingReminderWhatsApp({
      bookingId: "b-1",
      businessSlug: "demo-barberia",
      customerName: "Cliente",
      customerEmail: "a@b.com",
      customerPhone: "+5491155550101",
      confirmation,
    });
    expect(result.status).toBe("skipped");
  });

  it("skips business notification when no email configured", async () => {
    const { sendBusinessNotificationEmail } = await import("./booking-notifications");
    const result = await sendBusinessNotificationEmail({
      ...confirmation,
      bookingId: "b-1",
      confirmationCode: "ABC",
      customerName: "Cliente",
      customerEmail: "cliente@example.com",
      customerPhone: "+5491155550101",
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      businessNotificationEmail: undefined,
      serviceId: "svc-1",
      priceAmount: null,
      currency: "ARS",
      startsAt: "2026-05-01T09:00:00.000Z",
      timezone: "America/Argentina/Buenos_Aires",
      status: "confirmed",
    });
    expect(result.status).toBe("skipped");
  });

  it("sends business notification email when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "turnos@reservaya.ar";
    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.ar";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_789" }),
    });

    const { sendBusinessNotificationEmail } = await import("./booking-notifications");
    const result = await sendBusinessNotificationEmail({
      ...confirmation,
      bookingId: "b-1",
      confirmationCode: "ABC",
      customerName: "Cliente QA",
      customerEmail: "cliente@example.com",
      customerPhone: "+5491155550101",
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      businessNotificationEmail: "negocio@example.com",
      serviceId: "svc-1",
      priceAmount: null,
      currency: "ARS",
      startsAt: "2026-05-01T09:00:00.000Z",
      timezone: "America/Argentina/Buenos_Aires",
      status: "confirmed",
    });
    expect(result.status).toBe("sent");
  });

  it("sends follow-up email when Resend is configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "turnos@reservaya.ar";
    process.env.NEXT_PUBLIC_APP_URL = "https://reservaya.ar";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_followup" }),
    });

    const { sendPostBookingFollowUpEmail } = await import("./booking-notifications");
    const result = await sendPostBookingFollowUpEmail({
      customerEmail: "cliente@example.com",
      customerName: "Cliente QA",
      businessName: "Demo Barberia",
      businessSlug: "demo-barberia",
      serviceName: "Corte de pelo",
      bookingDate: "2026-05-01",
      bookingId: "b-1",
      manageToken: "token123",
    });
    expect(result.status).toBe("sent");
  });

  it("skips follow-up WhatsApp when Twilio is not configured", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    const { sendPostBookingFollowUpWhatsApp } = await import("./booking-notifications");
    const result = await sendPostBookingFollowUpWhatsApp({
      customerPhone: "+5491155550101",
      customerName: "Cliente",
      businessName: "Demo Barberia",
      businessSlug: "demo-barberia",
      serviceName: "Corte de pelo",
    });
    expect(result.status).toBe("skipped");
  });

  it("sends follow-up WhatsApp when Twilio is configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "auth";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ sid: "SM_followup" }),
    });

    const { sendPostBookingFollowUpWhatsApp } = await import("./booking-notifications");
    const result = await sendPostBookingFollowUpWhatsApp({
      customerPhone: "+5491155550101",
      customerName: "Cliente QA",
      businessName: "Demo Barberia",
      businessSlug: "demo-barberia",
      serviceName: "Corte de pelo",
      reviewUrl: "https://reservaya.ar/demo-barberia/resena?booking=b-1&token=tok",
    });
    expect(result.status).toBe("sent");
  });
});
