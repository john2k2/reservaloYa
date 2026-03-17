import { Resend } from "resend";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

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
  if (input.customerPhone) channels.push("sms");
  return channels;
}

export function hasReminderProviderConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

type ReminderResult =
  | { status: "sent"; messageId: string; subject: string }
  | { status: "skipped"; reason: string; subject?: string }
  | { status: "error"; error: string; subject?: string };

type ReminderInput = {
  bookingId?: string;
  customerEmail?: string | null;
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

function toISOString(bookingDate: string, startTime: string, timezone: string): string {
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
  const manageUrl = input.manageToken
    ? `${getBaseUrl()}/${input.businessSlug}/mi-turno?token=${input.manageToken}`
    : `${getBaseUrl()}/${input.businessSlug}`;

  const startsAt = toISOString(confirmation.bookingDate, confirmation.startTime, confirmation.businessTimezone);

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

export async function sendBookingReminderWhatsApp(
  _input: Record<string, unknown>
): Promise<ReminderResult> {
  // TODO: implementar con Twilio cuando se configure TWILIO_ACCOUNT_SID
  console.log("sendBookingReminderWhatsApp: Twilio not configured yet");
  return { status: "skipped", reason: "twilio_not_configured" };
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

  const manageUrl = confirmation.manageToken
    ? `${getBaseUrl()}/${confirmation.businessSlug}/mi-turno?token=${confirmation.manageToken}`
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
