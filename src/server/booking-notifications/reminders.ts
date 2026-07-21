import { canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";
import { createLogger } from "@/server/logger";
import { timeoutSignal } from "@/lib/fetch-with-timeout";
import {
  isMetaWhatsAppConfigured,
  sendReminderWhatsApp,
} from "@/lib/whatsapp-meta";
import {
  toISOString,
  getBaseUrl,
  formatDate,
  formatWhatsAppDate,
  buildWhatsAppReminderBody,
  buildReminderEmailHtml,
} from "../email-templates";
import { getFromEmail, sendResendEmail } from "./email-core";

const logger = createLogger("Booking Notifications");

// Re-exportar tipos para compatibilidad
export type ReminderChannel = "email" | "sms" | "whatsapp";

export function getAvailableReminderChannels(input: {
  customerEmail?: string | null;
  customerPhone?: string | null;
}): ReminderChannel[] {
  const channels: ReminderChannel[] = [];
  if (input.customerEmail) channels.push("email");
  if (input.customerPhone && (isMetaWhatsAppConfigured() || isTwilioConfigured())) {
    channels.push("whatsapp");
  }
  return channels;
}

export function hasReminderProviderConfigured(): boolean {
  return !!process.env.RESEND_API_KEY || isMetaWhatsAppConfigured() || isTwilioConfigured();
}

export type ReminderResult =
  | { status: "sent"; messageId: string; subject: string }
  | { status: "skipped"; reason: string; subject?: string }
  | { status: "error"; error: string; subject?: string };

export type ReminderInput = {
  bookingId?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  businessSlug: string;
  manageToken?: string;
  confirmation: {
    businessName: string;
    businessAddress?: string | null;
    businessTimezone: string;
    bookingDate: string;  // "YYYY-MM-DD"
    startTime: string;    // "HH:mm"
    serviceName: string;
    durationMinutes: number;
  };
};

export async function sendBookingReminderEmail(input: ReminderInput): Promise<ReminderResult> {
  if (!input.customerEmail) {
    return { status: "skipped", reason: "no_customer_email" };
  }

  const { confirmation } = input;
  const subject = `⏰ Recordatorio: tu reserva en ${confirmation.businessName} es mañana`;
  const reminderToken =
    input.manageToken ??
    (input.bookingId && canGenerateBookingManageLinks()
      ? createBookingManageToken(input.businessSlug, input.bookingId)
      : null);
  const manageUrl = reminderToken && input.bookingId
    ? `${getBaseUrl()}/${input.businessSlug}/mi-turno?booking=${input.bookingId}&token=${reminderToken}`
    : `${getBaseUrl()}/${input.businessSlug}`;

  const startsAt = toISOString(confirmation.bookingDate, confirmation.startTime);

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail(confirmation.businessName),
      to: [input.customerEmail],
      subject,
      html: buildReminderEmailHtml({
        customerName: input.customerName,
        businessName: confirmation.businessName,
        serviceName: confirmation.serviceName,
        date: formatDate(startsAt, confirmation.businessTimezone),
        time: confirmation.startTime,
        address: confirmation.businessAddress || null,
        manageUrl,
      }),
    });

    if (error) {
      logger.error("Resend reminder error", error);
      return { status: "error", error: error.message, subject };
    }

    logger.info(`Recordatorio enviado a ${input.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send reminder email", err);
    return { status: "error", error: message, subject };
  }
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

export async function sendBookingReminderWhatsApp(
  input: ReminderInput
): Promise<ReminderResult> {
  if (!input.customerPhone) {
    return { status: "skipped", reason: "no_customer_phone" };
  }

  // Meta WhatsApp Cloud API (preferido sobre Twilio)
  if (isMetaWhatsAppConfigured()) {
    const { confirmation } = input;
    const startsAt = toISOString(confirmation.bookingDate, confirmation.startTime);
    const dateLabel = formatWhatsAppDate(startsAt, confirmation.businessTimezone);
    const reminderToken =
      input.manageToken ??
      (input.bookingId && canGenerateBookingManageLinks()
        ? createBookingManageToken(input.businessSlug, input.bookingId)
        : null);
    const manageUrl = reminderToken && input.bookingId
      ? `${getBaseUrl()}/${input.businessSlug}/mi-turno?booking=${input.bookingId}&token=${reminderToken}`
      : `${getBaseUrl()}/${input.businessSlug}`;

    const result = await sendReminderWhatsApp({
      customerPhone: input.customerPhone,
      businessName: confirmation.businessName,
      customerName: input.customerName,
      serviceName: confirmation.serviceName,
      dateLabel,
      time: confirmation.startTime,
      manageUrl,
    });

    if (result.status !== "skipped") {
      return { ...result, subject: `WhatsApp recordatorio: ${confirmation.businessName}` };
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  if (!accountSid || !authToken || !fromNumber) {
    return { status: "skipped", reason: "twilio_not_configured" };
  }

  const { confirmation } = input;
  const subject = `WhatsApp recordatorio: ${confirmation.businessName}`;

  try {
    // Normalizar número: agregar "+" si no lo tiene, quitar espacios
    const toNumber = input.customerPhone.replace(/\s/g, "").startsWith("+")
      ? input.customerPhone.replace(/\s/g, "")
      : `+${input.customerPhone.replace(/\s/g, "")}`;

    const fromWhatsApp = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    const toWhatsApp = `whatsapp:${toNumber}`;

    const startsAt = toISOString(
      confirmation.bookingDate,
      confirmation.startTime
    );
    const dateLabel = formatWhatsAppDate(
      startsAt,
      confirmation.businessTimezone
    );

    const messageBody = buildWhatsAppReminderBody({
      customerName: input.customerName,
      businessName: confirmation.businessName,
      serviceName: confirmation.serviceName,
      dateLabel,
      time: confirmation.startTime,
    });

    // Use Twilio REST API directly to avoid requiring the full SDK
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body: Record<string, string> = {
      From: fromWhatsApp,
      To: toWhatsApp,
    };

    if (templateSid) {
      // Content template API - variables match Twilio template:
      // "Your appointment is coming up on {{1}} at {{2}}."
      body.ContentSid = templateSid;
      body.ContentVariables = JSON.stringify({
        "1": dateLabel,
        "2": confirmation.startTime,
      });
    } else {
      body.Body = messageBody;
    }

    const formBody = Object.entries(body)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
      signal: timeoutSignal(10_000),
    });

    const data = await response.json() as { sid?: string; error_message?: string; message?: string };

    if (!response.ok) {
      const errMsg = data.error_message ?? data.message ?? `HTTP ${response.status}`;
      logger.error("Twilio WhatsApp error", errMsg);
      return { status: "error", error: errMsg, subject };
    }

    logger.info(`WhatsApp recordatorio enviado a ${toNumber} (sid: ${data.sid})`);
    return { status: "sent", messageId: data.sid ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send WhatsApp reminder", err);
    return { status: "error", error: message, subject };
  }
}
