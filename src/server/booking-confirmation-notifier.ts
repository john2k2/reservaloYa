import {
  sendBookingConfirmationEmail,
  sendBookingConfirmationWhatsApp,
  sendBusinessNotificationEmail,
  type BookingConfirmationData,
} from "@/server/booking-notifications";
import { createLogger } from "@/server/logger";
import { getSupabaseAdminClient } from "@/server/supabase-store/_core";

const logger = createLogger("Booking Confirmation Notifier");

type NotificationResult =
  | { status: "sent" }
  | { status: "skipped"; reason?: string }
  | { status: "error"; error?: string };

function toCommunicationEventStatus(result: NotificationResult): "sent" | "failed" | "skipped" {
  if (result.status === "error") return "failed";
  return result.status;
}

function resultNote(result: NotificationResult): string | undefined {
  if (result.status === "error") return result.error;
  if (result.status === "skipped") return result.reason;
  return undefined;
}

async function recordConfirmationEvent(input: {
  bookingId: string;
  businessId: string;
  recipient?: string;
  status: "sent" | "failed" | "skipped";
  subject: string;
  note?: string;
  channel?: "email" | "whatsapp";
}) {
  try {
    const client = await getSupabaseAdminClient();
    const { data: booking } = await client
      .from("bookings")
      .select("customer_id")
      .eq("id", input.bookingId)
      .single();

    const customerId = (booking as { customer_id?: string } | null)?.customer_id;
    if (!customerId) return;

    await client.from("communication_events").insert({
      business_id: input.businessId,
      booking_id: input.bookingId,
      customer_id: customerId,
      channel: input.channel ?? "email",
      kind: "confirmation",
      status: input.status,
      recipient: input.recipient ?? "",
      subject: input.subject,
      note: input.note ?? "",
    });
  } catch (err) {
    logger.error("No se pudo registrar el evento de confirmacion", err);
  }
}

/**
 * Envía las notificaciones de confirmación de un turno (email y WhatsApp al
 * cliente, email al negocio) y registra cada resultado en communication_events.
 * Punto único usado por alta pública, reprogramación y webhook de pago.
 *
 * Nunca lanza: las funciones de envío ya devuelven { status: "error" } ante
 * fallos de proveedor y el registro de eventos es best-effort, para que una
 * notificación fallida nunca rompa el flujo de reserva/pago.
 *
 * Los envíos al cliente se intentan siempre (cada sender se auto-omite si falta
 * el dato de contacto); el evento solo se registra cuando hay destinatario.
 */
export async function notifyBookingConfirmation(input: {
  confirmation: BookingConfirmationData;
  mode: "created" | "rescheduled";
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<void> {
  const { confirmation, mode } = input;
  const customerEmail = input.customerEmail ?? confirmation.customerEmail;
  const customerPhone = input.customerPhone ?? confirmation.customerPhone;

  const emailResult = await sendBookingConfirmationEmail(confirmation, mode);
  if (customerEmail) {
    await recordConfirmationEvent({
      bookingId: confirmation.bookingId,
      businessId: confirmation.businessId,
      recipient: customerEmail,
      status: toCommunicationEventStatus(emailResult),
      subject: "Confirmacion de reserva",
      note: resultNote(emailResult),
    });
  }

  const whatsappResult = await sendBookingConfirmationWhatsApp(confirmation);
  if (customerPhone) {
    await recordConfirmationEvent({
      bookingId: confirmation.bookingId,
      businessId: confirmation.businessId,
      recipient: customerPhone,
      status: toCommunicationEventStatus(whatsappResult),
      subject: "Confirmacion de reserva",
      note: resultNote(whatsappResult),
      channel: "whatsapp",
    });
  }

  if (confirmation.businessNotificationEmail) {
    const businessResult = await sendBusinessNotificationEmail(confirmation, mode);
    await recordConfirmationEvent({
      bookingId: confirmation.bookingId,
      businessId: confirmation.businessId,
      recipient: confirmation.businessNotificationEmail,
      status: toCommunicationEventStatus(businessResult),
      subject: "Notificacion de nueva reserva al negocio",
      note: resultNote(businessResult),
    });
  }
}
