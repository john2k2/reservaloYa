import { emailBase } from "../email-templates";
import { getFromEmail, sendResendEmail, type BookingEmailResult } from "./email-core";

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
