import { canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";
import { createLogger } from "@/server/logger";
import {
  isMetaWhatsAppConfigured,
  sendConfirmationWhatsApp,
  sendReminderWhatsApp,
  sendReviewRequestWhatsApp,
} from "@/lib/whatsapp-meta";
import {
  toISOString,
  getBaseUrl,
  formatDate,
  formatWhatsAppDate,
  buildWhatsAppReminderBody,
  formatTime,
  formatDuration,
  formatPrice,
  buildConfirmationEmailHtml,
  buildReminderEmailHtml,
  buildBusinessNotificationHtml,
  buildFollowUpEmailHtml,
  emailBase,
} from "./email-templates";

const logger = createLogger("Booking Notifications");

type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
};

async function sendResendEmail(payload: ResendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
  } | null;

  if (!response.ok) {
    return {
      data: null,
      error: {
        message: body?.message ?? body?.name ?? `Resend HTTP ${response.status}`,
      },
    };
  }

  return { data: { id: body?.id ?? "" }, error: null };
}

/**
 * FROM email: usa dominio verificado si está configurado,
 * si no usa onboarding@resend.dev (gratuito, no requiere dominio propio).
 * Nota: con onboarding@resend.dev solo se puede enviar a emails verificados
 * en Resend en modo test. Para producción real configurar RESEND_FROM_EMAIL
 * con un dominio propio verificado.
 */
function getFromEmail(businessName?: string): string {
  const configured = process.env.RESEND_FROM_EMAIL;
  const from = configured || "onboarding@resend.dev";
  return businessName ? `${businessName} <${from}>` : `ReservaYa <${from}>`;
}

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

type ReminderResult =
  | { status: "sent"; messageId: string; subject: string }
  | { status: "skipped"; reason: string; subject?: string }
  | { status: "error"; error: string; subject?: string };

type ReminderInput = {
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

export type BookingConfirmationData = {
  bookingId: string;
  confirmationCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessAddress: string | null;
  businessNotificationEmail?: string | null;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceAmount: number | null;
  currency: string;
  startsAt: string; // ISO string
  timezone: string;
  status: string;
  manageToken?: string;
};

type BookingEmailResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

/**
 * Envía email de confirmación al cliente usando HTML inline.
 * No requiere dominio verificado ni Resend Templates.
 */
export async function sendBookingConfirmationEmail(
  confirmation: BookingConfirmationData,
  mode: "created" | "rescheduled" = "created"
): Promise<BookingEmailResult> {
  if (!confirmation.customerEmail) {
    return { status: "skipped", reason: "no_customer_email" };
  }

  const subject =
    mode === "rescheduled"
      ? `✅ Tu reserva en ${confirmation.businessName} fue reprogramada`
      : `✅ Tu reserva en ${confirmation.businessName} está confirmada`;

  const token =
    confirmation.manageToken ??
    (canGenerateBookingManageLinks()
      ? createBookingManageToken(confirmation.businessSlug, confirmation.bookingId)
      : null);
  const manageUrl = token
    ? `${getBaseUrl()}/${confirmation.businessSlug}/mi-turno?booking=${confirmation.bookingId}&token=${token}`
    : `${getBaseUrl()}/${confirmation.businessSlug}`;

  const priceLabel = formatPrice(confirmation.priceAmount, confirmation.currency);

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail(confirmation.businessName),
      to: [confirmation.customerEmail],
      subject,
      html: buildConfirmationEmailHtml({
        mode,
        customerName: confirmation.customerName,
        businessName: confirmation.businessName,
        serviceName: confirmation.serviceName,
        date: formatDate(confirmation.startsAt, confirmation.timezone),
        time: formatTime(confirmation.startsAt, confirmation.timezone),
        duration: formatDuration(confirmation.durationMinutes),
        price: priceLabel,
        address: confirmation.businessAddress,
        manageUrl,
      }),
      tags: [
        { name: "type", value: "booking_confirmation" },
        { name: "business", value: confirmation.businessSlug },
        { name: "mode", value: mode },
      ],
    });

    if (error) {
      logger.error("Resend error", error);
      return { status: "error", error: error.message };
    }

    logger.info(`Email de confirmacion enviado a ${confirmation.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send booking confirmation", err);
    return { status: "error", error: message };
  }
}

/**
 * Envía notificación al negocio usando HTML inline.
 */
export async function sendBusinessNotificationEmail(
  confirmation: BookingConfirmationData,
  mode: "created" | "rescheduled" = "created"
): Promise<BookingEmailResult> {
  if (!confirmation.businessNotificationEmail) {
    return { status: "skipped", reason: "no_business_notification_email" };
  }

  const subject =
    mode === "rescheduled"
      ? `📅 Reserva reprogramada: ${confirmation.serviceName} - ${confirmation.customerName}`
      : `🎉 Nueva reserva: ${confirmation.serviceName} - ${confirmation.customerName}`;

  const adminUrl = `${getBaseUrl()}/admin/bookings`;

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail("ReservaYa"),
      to: [confirmation.businessNotificationEmail],
      subject,
      html: buildBusinessNotificationHtml({
        mode,
        businessName: confirmation.businessName,
        customerName: confirmation.customerName,
        customerEmail: confirmation.customerEmail,
        customerPhone: confirmation.customerPhone,
        serviceName: confirmation.serviceName,
        date: formatDate(confirmation.startsAt, confirmation.timezone),
        time: formatTime(confirmation.startsAt, confirmation.timezone),
        duration: formatDuration(confirmation.durationMinutes),
        adminUrl,
      }),
      tags: [
        { name: "type", value: "business_notification" },
        { name: "business", value: confirmation.businessSlug },
        { name: "mode", value: mode },
      ],
    });

    if (error) {
      logger.error("Resend error", error);
      return { status: "error", error: error.message };
    }

    logger.info(`Notificacion enviada a ${confirmation.businessNotificationEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send business notification", err);
    return { status: "error", error: message };
  }
}

/**
 * Envía confirmación de reserva por WhatsApp vía Meta Cloud API.
 * Complementa (no reemplaza) el email de confirmación.
 */
export async function sendBookingConfirmationWhatsApp(
  confirmation: BookingConfirmationData,
): Promise<BookingEmailResult> {
  if (!confirmation.customerPhone) {
    return { status: "skipped", reason: "no_customer_phone" };
  }
  if (!isMetaWhatsAppConfigured()) {
    return { status: "skipped", reason: "meta_whatsapp_not_configured" };
  }

  const token =
    confirmation.manageToken ??
    (canGenerateBookingManageLinks()
      ? createBookingManageToken(confirmation.businessSlug, confirmation.bookingId)
      : null);
  const manageUrl = token
    ? `${getBaseUrl()}/${confirmation.businessSlug}/mi-turno?booking=${confirmation.bookingId}&token=${token}`
    : `${getBaseUrl()}/${confirmation.businessSlug}`;

  const dateLabel = formatWhatsAppDate(confirmation.startsAt, confirmation.timezone);
  const time = formatTime(confirmation.startsAt, confirmation.timezone);

  const result = await sendConfirmationWhatsApp({
    customerPhone: confirmation.customerPhone,
    businessName: confirmation.businessName,
    customerName: confirmation.customerName,
    serviceName: confirmation.serviceName,
    dateLabel,
    time,
    manageUrl,
  });

  if (result.status === "sent") return { status: "sent", messageId: result.messageId };
  if (result.status === "skipped") return { status: "skipped", reason: result.reason };
  return { status: "error", error: result.error };
}

type FollowUpInput = {
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

type FollowUpWhatsAppInput = {
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

// ─── Helper functions ────────────────────────────────────────────────────────

export async function sendWaitlistAvailabilityEmail(input: {
  customerEmail: string;
  customerName: string;
  businessName: string;
  bookingDate: string;
  bookingUrl: string;
}): Promise<BookingEmailResult> {
  try {
    const [year, month, day] = input.bookingDate.split("-").map(Number);
    const dateLabel = new Date(year, (month ?? 1) - 1, day).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const subject = `¡Hay un turno disponible en ${input.businessName}!`;
    const headline = "¡Se liberó un turno!";
    const content = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hola ${input.customerName}, ¡buenas noticias!
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Se liberó un turno para el <strong>${dateLabel}</strong> en <strong>${input.businessName}</strong> que estabas esperando.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
      Los turnos disponibles se llenan rápido — reservá ahora para asegurar tu lugar.
    </p>
    <a href="${input.bookingUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
      Reservar turno
    </a>`;

    const { data, error } = await sendResendEmail({
      from: getFromEmail(input.businessName),
      to: [input.customerEmail],
      subject,
      html: emailBase(headline, content),
    });

    if (error || !data?.id) {
      return { status: "error", error: error?.message ?? "Error desconocido" };
    }

    return { status: "sent", messageId: data.id };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
