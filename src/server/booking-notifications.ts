import { Resend } from "resend";

import { buildAbsoluteManageBookingUrl } from "@/server/public-booking-links";

type BookingEmailInput = {
  bookingId: string;
  businessSlug: string;
  customerName: string;
  customerEmail?: string;
  mode?: "created" | "rescheduled";
  confirmation: {
    businessName: string;
    businessAddress: string;
    businessTimezone: string;
    bookingDate: string;
    startTime: string;
    serviceName: string;
    durationMinutes: number;
  };
};

type BookingEmailResult = {
  status: "sent" | "skipped" | "failed";
  subject: string;
  reason?: string;
};

type BookingWhatsAppResult = BookingEmailResult;

type ReminderChannel = "email" | "whatsapp";

type ReminderRecipientInput = {
  customerEmail?: string;
  customerPhone?: string;
};

function getTwilioWhatsAppConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  if (!accountSid || !authToken || !fromNumber || !templateSid) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber,
    templateSid,
  };
}

function normalizePhoneForWhatsApp(phone?: string) {
  const raw = String(phone ?? "").trim();

  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/[^\d+]/g, "");
  const compact =
    normalized.startsWith("+") ? `+${normalized.slice(1).replace(/\+/g, "")}` : normalized;

  if (!compact.startsWith("+") || compact.length < 8) {
    return null;
  }

  return `whatsapp:${compact}`;
}

export function isEmailProviderReady() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isWhatsAppProviderReady() {
  return Boolean(getTwilioWhatsAppConfig());
}

export function hasReminderProviderConfigured() {
  return isEmailProviderReady() || isWhatsAppProviderReady();
}

export function getAvailableReminderChannels(input: ReminderRecipientInput): ReminderChannel[] {
  const channels: ReminderChannel[] = [];

  if (input.customerEmail && isEmailProviderReady()) {
    channels.push("email");
  }

  if (normalizePhoneForWhatsApp(input.customerPhone) && isWhatsAppProviderReady()) {
    channels.push("whatsapp");
  }

  return channels;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "ReservaYa <onboarding@resend.dev>";
}

async function sendBookingEmail(input: {
  customerName: string;
  customerEmail?: string;
  subject: string;
  heading: string;
  businessSlug: string;
  bookingId: string;
  confirmation: BookingEmailInput["confirmation"];
}): Promise<BookingEmailResult> {
  if (!input.customerEmail) {
    return {
      status: "skipped",
      subject: input.subject,
      reason: "missing_customer_email",
    };
  }

  const resend = getResendClient();

  if (!resend) {
    return {
      status: "skipped",
      subject: input.subject,
      reason: "missing_resend_api_key",
    };
  }

  const manageUrl = buildAbsoluteManageBookingUrl(input.businessSlug, input.bookingId);

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.customerEmail,
      subject: input.subject,
      text: [
        `Hola ${input.customerName || "cliente"},`,
        "",
        input.heading,
        `${input.confirmation.serviceName} - ${input.confirmation.bookingDate} a las ${input.confirmation.startTime}`,
        `${input.confirmation.businessName} - ${input.confirmation.businessAddress}`,
        "",
        manageUrl ? `Gestionar turno: ${manageUrl}` : "Gestion del turno disponible pronto.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h1 style="font-size:20px;margin-bottom:12px">${input.heading}</h1>
          <p>Hola ${input.customerName || "cliente"},</p>
          <p>
            <strong>${input.confirmation.serviceName}</strong><br />
            ${input.confirmation.bookingDate} a las ${input.confirmation.startTime}<br />
            ${input.confirmation.businessName}<br />
            ${input.confirmation.businessAddress}
          </p>
          ${
            manageUrl
              ? `<p>
            <a
              href="${manageUrl}"
              style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px"
            >
              Ver, reprogramar o cancelar
            </a>
          </p>`
              : ""
          }
        </div>
      `,
    });

    return {
      status: "sent",
      subject: input.subject,
    };
  } catch (error) {
    console.error("Failed to send booking email", error);

    return {
      status: "failed",
      subject: input.subject,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  const actionLabel =
    input.mode === "rescheduled" ? "Tu turno fue reprogramado" : "Tu turno fue confirmado";
  const subject =
    input.mode === "rescheduled"
      ? `${input.confirmation.businessName}: tu turno fue reprogramado`
      : `${input.confirmation.businessName}: confirmacion de tu turno`;

  return sendBookingEmail({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject,
    heading: actionLabel,
    businessSlug: input.businessSlug,
    bookingId: input.bookingId,
    confirmation: input.confirmation,
  });
}

export async function sendBookingReminderEmail(input: BookingEmailInput) {
  return sendBookingEmail({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject: `${input.confirmation.businessName}: recordatorio de tu turno`,
    heading: "Te recordamos tu proximo turno",
    businessSlug: input.businessSlug,
    bookingId: input.bookingId,
    confirmation: input.confirmation,
  });
}

export async function sendBookingReminderWhatsApp(
  input: BookingEmailInput & { customerPhone?: string }
): Promise<BookingWhatsAppResult> {
  const subject = `${input.confirmation.businessName}: recordatorio de tu turno por WhatsApp`;
  const recipient = normalizePhoneForWhatsApp(input.customerPhone);

  if (!recipient) {
    return {
      status: "skipped",
      subject,
      reason: "missing_or_invalid_customer_phone",
    };
  }

  const twilio = getTwilioWhatsAppConfig();

  if (!twilio) {
    return {
      status: "skipped",
      subject,
      reason: "missing_twilio_whatsapp_config",
    };
  }

  const manageUrl = buildAbsoluteManageBookingUrl(input.businessSlug, input.bookingId);
  const body = new URLSearchParams({
    From: twilio.fromNumber,
    To: recipient,
    ContentSid: twilio.templateSid,
    ContentVariables: JSON.stringify({
      "1": input.customerName || "cliente",
      "2": input.confirmation.businessName,
      "3": input.confirmation.serviceName,
      "4": input.confirmation.bookingDate,
      "5": input.confirmation.startTime,
      "6": manageUrl ?? "",
    }),
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return {
        status: "failed",
        subject,
        reason: errorText || `twilio_http_${response.status}`,
      };
    }

    return {
      status: "sent",
      subject,
    };
  } catch (error) {
    console.error("Failed to send booking WhatsApp reminder", error);

    return {
      status: "failed",
      subject,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}
