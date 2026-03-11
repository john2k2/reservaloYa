import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const emailSendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = {
      send: emailSendMock,
    };
  },
}));

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
    emailSendMock.mockReset();
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

    emailSendMock.mockResolvedValue({ id: "email_123" });

    const { sendBookingConfirmationEmail } = await import("./booking-notifications");

    const result = await sendBookingConfirmationEmail({
      bookingId: "booking_123",
      businessSlug: "demo-barberia",
      customerName: "Cliente QA",
      customerEmail: "cliente@example.com",
      confirmation,
    });

    expect(result.status).toBe("sent");
    expect(emailSendMock).toHaveBeenCalledTimes(1);
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
      text: async () => "",
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
});
