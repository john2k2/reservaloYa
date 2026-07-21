import { createLogger } from "@/server/logger";
import { timeoutSignal } from "@/lib/fetch-with-timeout";
import {
  isMetaWhatsAppConfigured,
  sendReviewRequestWhatsApp,
} from "@/lib/whatsapp-meta";
import { getBaseUrl, buildFollowUpEmailHtml } from "../email-templates";
import { getFromEmail, sendResendEmail, type BookingEmailResult } from "./email-core";
import type { ReminderResult } from "./reminders";

const logger = createLogger("Booking Notifications");

export type FollowUpInput = {
  customerEmail: string;
  customerName: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  bookingDate: string;
  bookingId?: string;
  manageToken?: string;
};

/**
 * Envía email de seguimiento post-turno al cliente (~1h después del servicio).
 * Pregunta por la experiencia e invita a reservar nuevamente.
 */
export async function sendPostBookingFollowUpEmail(input: FollowUpInput): Promise<BookingEmailResult> {
  const subject = `¿Cómo fue tu experiencia en ${input.businessName}?`;

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail(input.businessName),
      to: [input.customerEmail],
      subject,
      html: buildFollowUpEmailHtml({
        customerName: input.customerName,
        businessName: input.businessName,
        businessSlug: input.businessSlug,
        serviceName: input.serviceName,
        bookingDate: input.bookingDate,
        bookingUrl: `${getBaseUrl()}/${input.businessSlug}/reservar`,
        reviewUrl:
          input.bookingId && input.manageToken
            ? `${getBaseUrl()}/${input.businessSlug}/resena?booking=${input.bookingId}&token=${input.manageToken}`
            : undefined,
      }),
      tags: [
        { name: "type", value: "booking_followup" },
        { name: "business", value: input.businessSlug },
      ],
    });

    if (error) {
      logger.error("Resend followup error", error);
      return { status: "error", error: error.message };
    }

    logger.info(`Follow-up enviado a ${input.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send follow-up email", err);
    return { status: "error", error: message };
  }
}

export type FollowUpWhatsAppInput = {
  customerPhone: string;
  customerName: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  reviewUrl?: string;
};

/**
 * Envía WhatsApp de seguimiento post-turno con link a reseña.
 */
export async function sendPostBookingFollowUpWhatsApp(
  input: FollowUpWhatsAppInput
): Promise<ReminderResult> {
  const subject = `WhatsApp follow-up: ${input.businessName}`;

  // Meta WhatsApp Cloud API (preferido sobre Twilio)
  if (isMetaWhatsAppConfigured() && input.reviewUrl) {
    const result = await sendReviewRequestWhatsApp({
      customerPhone: input.customerPhone,
      businessName: input.businessName,
      customerName: input.customerName,
      serviceName: input.serviceName,
      reviewUrl: input.reviewUrl,
    });
    if (result.status !== "skipped") {
      return { ...result, subject };
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return { status: "skipped", reason: "whatsapp_not_configured" };
  }

  try {
    const toNumber = input.customerPhone.replace(/\s/g, "").startsWith("+")
      ? input.customerPhone.replace(/\s/g, "")
      : `+${input.customerPhone.replace(/\s/g, "")}`;

    const fromWhatsApp = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    const toWhatsApp = `whatsapp:${toNumber}`;

    const lines = [
      `Hola ${input.customerName} 👋`,
      `¿Cómo te fue con tu ${input.serviceName} en ${input.businessName}?`,
    ];
    if (input.reviewUrl) {
      lines.push(`Dejanos tu opinión (2 minutos): ${input.reviewUrl}`);
    }
    const messageBody = lines.join("\n");

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formBody = [
      `From=${encodeURIComponent(fromWhatsApp)}`,
      `To=${encodeURIComponent(toWhatsApp)}`,
      `Body=${encodeURIComponent(messageBody)}`,
    ].join("&");

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
      logger.error("Twilio follow-up WhatsApp error", errMsg);
      return { status: "error", error: errMsg, subject };
    }

    logger.info(`WhatsApp follow-up enviado a ${toNumber} (sid: ${data.sid})`);
    return { status: "sent", messageId: data.sid ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send follow-up WhatsApp", err);
    return { status: "error", error: message, subject };
  }
}
