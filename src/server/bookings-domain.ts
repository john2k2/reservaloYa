import type { PaymentStatus } from "@/types/domain";

export type BookingConfirmationView = {
  bookingId: string;
  confirmationCode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessAddress: string | null;
  businessTimezone: string;
  businessNotificationEmail?: string | null;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceAmount: number | null;
  currency: string;
  bookingDate: string;
  startTime: string;
  startsAt: string;
  timezone: string;
  status: string;
  manageToken?: string;
  source: "local" | "pocketbase";
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
};

export type ManageBookingView = {
  id: string;
  businessSlug: string;
  businessName: string;
  businessAddress: string;
  businessTimezone: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  bookingDate: string;
  startTime: string;
  status: string;
  statusLabel: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  source?: "local" | "pocketbase";
};

export function buildBookingStartsAt(bookingDate: string, startTime: string) {
  const [year, month, day] = bookingDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

export function buildBookingConfirmationView(input: {
  bookingId: string;
  confirmationCode?: string;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessAddress: string | null;
  businessTimezone: string;
  businessNotificationEmail?: string | null;
  serviceId?: string;
  serviceName?: string;
  durationMinutes?: number;
  priceAmount?: number | null;
  bookingDate: string;
  startTime: string;
  status: string;
  manageToken?: string;
  source: "local" | "pocketbase";
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
}): BookingConfirmationView {
  const startsAt = buildBookingStartsAt(input.bookingDate, input.startTime);

  return {
    bookingId: input.bookingId,
    confirmationCode: input.confirmationCode ?? input.bookingId.slice(0, 8).toUpperCase(),
    customerName: input.customerName ?? "Cliente",
    customerEmail: input.customerEmail ?? undefined,
    customerPhone: input.customerPhone ?? undefined,
    businessId: input.businessId,
    businessName: input.businessName,
    businessSlug: input.businessSlug,
    businessAddress: input.businessAddress,
    businessTimezone: input.businessTimezone,
    businessNotificationEmail: input.businessNotificationEmail,
    serviceId: input.serviceId ?? "",
    serviceName: input.serviceName ?? "Servicio",
    durationMinutes: input.durationMinutes ?? 60,
    priceAmount: input.priceAmount ?? null,
    currency: "ARS",
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    startsAt,
    timezone: input.businessTimezone,
    status: input.status,
    manageToken: input.manageToken,
    source: input.source,
    paymentStatus: input.paymentStatus,
    paymentAmount: input.paymentAmount,
    paymentCurrency: input.paymentCurrency,
    paymentProvider: input.paymentProvider,
  };
}

export function buildManageBookingView(input: {
  id: string;
  businessSlug: string;
  businessName: string;
  businessAddress?: string | null;
  businessTimezone: string;
  serviceId?: string;
  serviceName?: string;
  durationMinutes?: number;
  bookingDate: string;
  startTime: string;
  status: string;
  statusLabel: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  source?: "local" | "pocketbase";
}): ManageBookingView {
  return {
    id: input.id,
    businessSlug: input.businessSlug,
    businessName: input.businessName,
    businessAddress: input.businessAddress ?? "",
    businessTimezone: input.businessTimezone,
    serviceId: input.serviceId ?? "",
    serviceName: input.serviceName ?? "Servicio",
    durationMinutes: input.durationMinutes ?? 60,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    status: input.status,
    statusLabel: input.statusLabel,
    fullName: input.fullName ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
    notes: input.notes ?? "",
    source: input.source,
  };
}
