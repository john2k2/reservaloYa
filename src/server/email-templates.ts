import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { getPublicAppUrl } from "@/lib/runtime";

export function toISOString(bookingDate: string, startTime: string): string {
  // Combina fecha "YYYY-MM-DD" y hora "HH:mm" en ISO string
  const dateTimeStr = `${bookingDate}T${startTime}:00`;
  // Devuelve como ISO sin conversión de timezone (la función formatInTimeZone se encarga de eso)
  return dateTimeStr;
}

export function getBaseUrl(): string {
  return getPublicAppUrl();
}

export function formatDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
}

export function formatWhatsAppDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d/MM", { locale: es });
}

export function buildWhatsAppReminderBody(p: {
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

export function formatTime(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "HH:mm", { locale: es });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hora${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}min`;
}

export function formatPrice(amount: number | null, currency: string): string | null {
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


export function emailBase(title: string, content: string): string {
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

export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

export function buildConfirmationEmailHtml(p: {
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

export function buildReminderEmailHtml(p: {
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

export function buildBusinessNotificationHtml(p: {
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

export function buildFollowUpEmailHtml(p: {
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

