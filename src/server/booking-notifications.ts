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

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ortiz.jonathan2k@gmail.com";

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

// Stub functions for reminder emails - TODO: implement if needed
type ReminderResult = 
  | { status: "sent"; messageId: string; subject: string }
  | { status: "skipped"; reason: string; subject?: string }
  | { status: "error"; error: string; subject?: string };

export async function sendBookingReminderEmail(
  _input: Record<string, unknown>
): Promise<ReminderResult> {
  console.log("sendBookingReminderEmail: not implemented");
  return { status: "skipped", reason: "not_implemented", subject: "Recordatorio de reserva" };
}

export async function sendBookingReminderWhatsApp(
  _input: Record<string, unknown>
): Promise<ReminderResult> {
  console.log("sendBookingReminderWhatsApp: not implemented");
  return { status: "skipped", reason: "not_implemented", subject: "Recordatorio de reserva" };
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
 * Envía email al cliente usando plantilla de Resend
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
    ? `${getBaseUrl()}/${confirmation.businessSlug}/reserva/${confirmation.manageToken}`
    : `${getBaseUrl()}/${confirmation.businessSlug}`;

  const priceLabel = formatPrice(confirmation.priceAmount, confirmation.currency);

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: `${confirmation.businessName} <${FROM_EMAIL}>`,
        to: [confirmation.customerEmail],
        subject,
        template: {
          id: "customer-booking-confirmation",
          variables: {
            BUSINESS_NAME: confirmation.businessName,
            BRAND_COLOR: "#3b82f6",
            BRAND_COLOR_DARK: "#2563eb",
            CUSTOMER_NAME: confirmation.customerName,
            SERVICE_NAME: confirmation.serviceName,
            DATE: formatDate(confirmation.startsAt, confirmation.timezone),
            TIME: formatTime(confirmation.startsAt, confirmation.timezone),
            DURATION: formatDuration(confirmation.durationMinutes),
            PRICE: priceLabel || "",
            ADDRESS: confirmation.businessAddress || "",
            MANAGE_URL: manageUrl,
          },
        },
        tags: [
          { name: "type", value: "booking_confirmation" },
          { name: "business", value: confirmation.businessSlug },
          { name: "mode", value: mode },
        ],
      },
      { idempotencyKey: `booking-confirm/${confirmation.bookingId}` }
    );

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
 * Envía notificación al negocio usando plantilla de Resend
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

  const adminUrl = `${getBaseUrl()}/admin/reservas`;

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: `ReservaYa <${FROM_EMAIL}>`,
        to: [confirmation.businessNotificationEmail],
        subject,
        template: {
          id: "business-booking-notification",
          variables: {
            BUSINESS_NAME: confirmation.businessName,
            BRAND_COLOR: "#3b82f6",
            CUSTOMER_NAME: confirmation.customerName,
            CUSTOMER_EMAIL: confirmation.customerEmail || "",
            CUSTOMER_PHONE: confirmation.customerPhone || "",
            SERVICE_NAME: confirmation.serviceName,
            DATE: formatDate(confirmation.startsAt, confirmation.timezone),
            TIME: formatTime(confirmation.startsAt, confirmation.timezone),
            DURATION: formatDuration(confirmation.durationMinutes),
            ADMIN_URL: adminUrl,
          },
        },
        tags: [
          { name: "type", value: "business_notification" },
          { name: "business", value: confirmation.businessSlug },
          { name: "mode", value: mode },
        ],
      },
      { idempotencyKey: `business-notify/${confirmation.bookingId}` }
    );

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

// Helper functions
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

function formatDate(isoDate: string, timezone: string): string {
  return formatInTimeZone(new Date(isoDate), timezone, "EEEE d 'de' MMMM", {
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
