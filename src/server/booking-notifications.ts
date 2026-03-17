import { Resend } from "resend";

import { buildAbsoluteManageBookingUrl } from "@/server/public-booking-links";

type BookingEmailInput = {
  bookingId: string;
  businessSlug: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
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

type BusinessNotificationInput = {
  bookingId: string;
  businessSlug: string;
  businessName: string;
  notificationEmail: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  notes?: string;
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

function normalizePhoneForWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length < 10) return null;
  
  if (cleaned.startsWith("54")) {
    return `whatsapp:+${cleaned}`;
  }
  
  if (cleaned.startsWith("9")) {
    return `whatsapp:+54${cleaned}`;
  }
  
  return `whatsapp:+549${cleaned}`;
}

function hasReminderProviderConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY) || Boolean(process.env.TWILIO_ACCOUNT_SID);
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "ReservaYa <onboarding@resend.dev>";
}

async function sendBookingEmail({
  customerEmail,
  subject,
  heading,
  businessSlug,
  bookingId,
  confirmation,
  customerName,
}: {
  customerEmail?: string;
  subject: string;
  heading: string;
  businessSlug: string;
  bookingId: string;
  confirmation: BookingEmailInput["confirmation"];
  customerName: string;
}): Promise<BookingEmailResult> {
  if (!customerEmail) {
    return {
      status: "skipped",
      subject,
      reason: "missing_customer_email",
    };
  }

  const resend = getResendClient();

  if (!resend) {
    return {
      status: "skipped",
      subject,
      reason: "missing_resend_api_key",
    };
  }

  const manageUrl = buildAbsoluteManageBookingUrl(businessSlug, bookingId);

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: customerEmail,
      subject,
      text: [
        `Hola ${customerName || "cliente"},`,
        "",
        heading,
        `${confirmation.serviceName} - ${confirmation.bookingDate} a las ${confirmation.startTime}`,
        `${confirmation.businessName} - ${confirmation.businessAddress}`,
        "",
        manageUrl ? `Gestionar turno: ${manageUrl}` : "Gestion del turno disponible pronto.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h1 style="font-size:20px;margin-bottom:12px">${heading}</h1>
          <p>Hola ${customerName || "cliente"},</p>
          <p>
            <strong>${confirmation.serviceName}</strong><br />
            ${confirmation.bookingDate} a las ${confirmation.startTime}<br />
            ${confirmation.businessName}<br />
            ${confirmation.businessAddress}
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
      subject,
    };
  } catch (error) {
    console.error("Failed to send booking email", error);

    return {
      status: "failed",
      subject,
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
      : `${input.confirmation.businessName}: confirmación de tu turno`;

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

/**
 * Envía notificación al negocio cuando hay una nueva reserva
 */
export async function sendBusinessNotificationEmail(
  input: BusinessNotificationInput
): Promise<BookingEmailResult> {
  const subject = `Nueva reserva en ${input.businessName}: ${input.serviceName}`;
  const resend = getResendClient();

  if (!resend) {
    return {
      status: "skipped",
      subject,
      reason: "missing_resend_api_key",
    };
  }

  const customerInfo = [
    `Nombre: ${input.customerName}`,
    input.customerEmail ? `Email: ${input.customerEmail}` : "",
    input.customerPhone ? `Teléfono: ${input.customerPhone}` : "",
  ].filter(Boolean).join("\n");

  const manageUrl = buildAbsoluteManageBookingUrl(input.businessSlug, input.bookingId);

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.notificationEmail,
      subject,
      text: [
        `¡Tienes una nueva reserva!`,
        "",
        `Servicio: ${input.serviceName}`,
        `Fecha: ${input.bookingDate}`,
        `Hora: ${input.startTime}`,
        "",
        "Datos del cliente:",
        customerInfo,
        input.notes ? `\nNotas: ${input.notes}` : "",
        "",
        manageUrl ? `Ver detalles: ${manageUrl}` : "",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:600px;margin:0 auto;padding:20px">
          <h1 style="font-size:24px;margin-bottom:16px;color:#111827">¡Nueva reserva recibida!</h1>
          
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px">
            <p style="margin:0 0 8px 0"><strong>Servicio:</strong> ${input.serviceName}</p>
            <p style="margin:0 0 8px 0"><strong>Fecha:</strong> ${input.bookingDate}</p>
            <p style="margin:0"><strong>Hora:</strong> ${input.startTime}</p>
          </div>
          
          <h2 style="font-size:18px;margin-bottom:12px;color:#111827">Datos del cliente</h2>
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px">
            <p style="margin:0 0 8px 0"><strong>Nombre:</strong> ${input.customerName}</p>
            ${input.customerEmail ? `<p style="margin:0 0 8px 0"><strong>Email:</strong> ${input.customerEmail}</p>` : ""}
            ${input.customerPhone ? `<p style="margin:0"><strong>Teléfono:</strong> ${input.customerPhone}</p>` : ""}
          </div>
          
          ${input.notes ? `
          <h2 style="font-size:18px;margin-bottom:12px;color:#111827">Notas</h2>
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:20px">
            <p style="margin:0">${input.notes}</p>
          </div>
          ` : ""}
          
          ${manageUrl ? `
          <p style="margin-top:20px">
            <a
              href="${manageUrl}"
              style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:500"
            >
              Ver detalles del turno
            </a>
          </p>
          ` : ""}
        </div>
      `,
    });

    return {
      status: "sent",
      subject,
    };
  } catch (error) {
    console.error("Failed to send business notification email", error);

    return {
      status: "failed",
      subject,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export { hasReminderProviderConfigured, getResendClient };
export type { ReminderChannel, ReminderRecipientInput };
