import { Resend } from "resend";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;
function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
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
  if (input.customerPhone && isTwilioConfigured()) channels.push("whatsapp");
  return channels;
}

export function hasReminderProviderConfigured(): boolean {
  return !!process.env.RESEND_API_KEY || isTwilioConfigured();
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

function toISOString(bookingDate: string, startTime: string): string {
  // Combina fecha "YYYY-MM-DD" y hora "HH:mm" en ISO string
  const dateTimeStr = `${bookingDate}T${startTime}:00`;
  // Devuelve como ISO sin conversión de timezone (la función formatInTimeZone se encarga de eso)
  return dateTimeStr;
}

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
    const { data, error } = await getResend().emails.send({
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
      console.error("Resend reminder error:", error);
      return { status: "error", error: error.message, subject };
    }

    console.log(`📧 Recordatorio enviado a ${input.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send reminder email:", err);
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
      console.error("Twilio WhatsApp error:", errMsg);
      return { status: "error", error: errMsg, subject };
    }

    console.log(`📱 WhatsApp recordatorio enviado a ${toNumber} (sid: ${data.sid})`);
    return { status: "sent", messageId: data.sid ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send WhatsApp reminder:", err);
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
    const { data, error } = await getResend().emails.send({
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
      console.error("Resend error:", error);
      return { status: "error", error: error.message };
    }

    console.log(`📧 Email de confirmación enviado a ${confirmation.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send booking confirmation:", err);
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
    const { data, error } = await getResend().emails.send({
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
      console.error("Resend error:", error);
      return { status: "error", error: error.message };
    }

    console.log(`📧 Notificación enviada a ${confirmation.businessNotificationEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send business notification:", err);
    return { status: "error", error: message };
  }
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
    const { data, error } = await getResend().emails.send({
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
      console.error("Resend followup error:", error);
      return { status: "error", error: error.message };
    }

    console.log(`📧 Follow-up enviado a ${input.customerEmail}`);
    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send follow-up email:", err);
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
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return { status: "skipped", reason: "twilio_not_configured" };
  }

  const subject = `WhatsApp follow-up: ${input.businessName}`;

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
      console.error("Twilio follow-up WhatsApp error:", errMsg);
      return { status: "error", error: errMsg, subject };
    }

    console.log(`📱 WhatsApp follow-up enviado a ${toNumber} (sid: ${data.sid})`);
    return { status: "sent", messageId: data.sid ?? "", subject };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send follow-up WhatsApp:", err);
    return { status: "error", error: message, subject };
  }
}

// ─── Helper functions ────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function formatDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
}

function formatWhatsAppDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d/MM", { locale: es });
}

function buildWhatsAppReminderBody(p: {
  customerName: string;
  businessName: string;
  serviceName: string;
  dateLabel: string;
  time: string;
}): string {
  return (
    `¡Hola ${p.customerName}! 👋\n` +
    `Te recordamos tu turno de *${p.serviceName}* en *${p.businessName}*.\n` +
    `📅 ${p.dateLabel} a las ${p.time} hs.\n` +
    `Si necesitás cancelar o reprogramar, avisanos con anticipación.`
  );
}

function formatTime(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "HH:mm", { locale: es });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hora${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}min`;
}

function formatPrice(amount: number | null, currency: string): string | null {
  if (amount === null) return null;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

// ─── Email HTML templates ────────────────────────────────────────────────────

function emailBase(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">ReservaYa</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Este email fue enviado automáticamente por ReservaYa.<br/>
                Si no esperabas este mensaje, podés ignorarlo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

function buildConfirmationEmailHtml(p: {
  mode: "created" | "rescheduled";
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: string;
  price: string | null;
  address: string | null;
  manageUrl: string;
}): string {
  const isRescheduled = p.mode === "rescheduled";
  const headline = isRescheduled
    ? `Tu reserva fue reprogramada`
    : `¡Tu reserva está confirmada!`;
  const intro = isRescheduled
    ? `Hola <strong>${p.customerName}</strong>, tu turno en <strong>${p.businessName}</strong> fue reprogramado exitosamente.`
    : `Hola <strong>${p.customerName}</strong>, tu turno en <strong>${p.businessName}</strong> ha sido confirmado.`;

  const details = [
    detailRow("Servicio", p.serviceName),
    detailRow("Fecha", p.date),
    detailRow("Hora", p.time),
    detailRow("Duración", p.duration),
    ...(p.price ? [detailRow("Precio", p.price)] : []),
    ...(p.address ? [detailRow("Dirección", p.address)] : []),
  ].join("");

  const content = `
    <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">${headline}</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${intro}</p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${details}
      </table>
    </div>

    <a href="${p.manageUrl}" style="display:block;text-align:center;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:16px;">
      Ver o gestionar mi reserva
    </a>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Desde ese link podés reprogramar o cancelar tu turno.
    </p>`;

  return emailBase(headline, content);
}

function buildReminderEmailHtml(p: {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string | null;
  manageUrl: string;
}): string {
  const headline = "Recordatorio de tu turno";
  const details = [
    detailRow("Servicio", p.serviceName),
    detailRow("Fecha", p.date),
    detailRow("Hora", p.time),
    ...(p.address ? [detailRow("Dirección", p.address)] : []),
  ].join("");

  const content = `
    <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">⏰ ${headline}</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hola <strong>${p.customerName}</strong>, te recordamos que mañana tenés un turno en <strong>${p.businessName}</strong>.
    </p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${details}
      </table>
    </div>

    <a href="${p.manageUrl}" style="display:block;text-align:center;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:16px;">
      Ver o gestionar mi reserva
    </a>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Si necesitás cancelar o reprogramar, podés hacerlo desde ese link.
    </p>`;

  return emailBase(headline, content);
}

function buildBusinessNotificationHtml(p: {
  mode: "created" | "rescheduled";
  businessName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  date: string;
  time: string;
  duration: string;
  adminUrl: string;
}): string {
  const isRescheduled = p.mode === "rescheduled";
  const headline = isRescheduled ? "Reserva reprogramada" : "Nueva reserva recibida";
  const intro = isRescheduled
    ? `Un cliente reprogramó su turno en <strong>${p.businessName}</strong>.`
    : `Recibiste una nueva reserva en <strong>${p.businessName}</strong>.`;

  const details = [
    detailRow("Cliente", p.customerName),
    ...(p.customerEmail ? [detailRow("Email", p.customerEmail)] : []),
    ...(p.customerPhone ? [detailRow("Teléfono", p.customerPhone)] : []),
    detailRow("Servicio", p.serviceName),
    detailRow("Fecha", p.date),
    detailRow("Hora", p.time),
    detailRow("Duración", p.duration),
  ].join("");

  const content = `
    <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">${isRescheduled ? "📅" : "🎉"} ${headline}</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${intro}</p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${details}
      </table>
    </div>

    <a href="${p.adminUrl}" style="display:block;text-align:center;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:16px;">
      Ver en el panel admin
    </a>`;

  return emailBase(headline, content);
}

function buildFollowUpEmailHtml(p: {
  customerName: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  bookingDate: string;
  bookingUrl: string;
  reviewUrl?: string;
}): string {
  const headline = "¿Cómo estuvo tu visita?";
  const reviewButton = p.reviewUrl
    ? `<a href="${p.reviewUrl}" style="display:block;text-align:center;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:12px;">
      ⭐ Dejá tu reseña
    </a>`
    : "";
  const content = `
    <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">⭐ ${headline}</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hola <strong>${p.customerName}</strong>, esperamos que hayas disfrutado tu servicio de
      <strong>${p.serviceName}</strong> en <strong>${p.businessName}</strong>.
    </p>

    ${reviewButton}

    <a href="${p.bookingUrl}" style="display:block;text-align:center;background:#ffffff;color:#374151;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:16px;border:1px solid #e5e7eb;">
      Reservar nuevo turno
    </a>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      Gracias por elegirnos. ¡Te esperamos pronto!
    </p>`;

  return emailBase(headline, content);
}
