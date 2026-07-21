import { canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";
import { createLogger } from "@/server/logger";
import {
  isMetaWhatsAppConfigured,
  sendConfirmationWhatsApp,
} from "@/lib/whatsapp-meta";
import {
  getBaseUrl,
  formatDate,
  formatWhatsAppDate,
  formatTime,
  formatDuration,
  formatPrice,
  buildConfirmationEmailHtml,
  buildBusinessNotificationHtml,
} from "../email-templates";
import { getFromEmail, sendResendEmail, type BookingEmailResult } from "./email-core";

const logger = createLogger("Booking Notifications");

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
