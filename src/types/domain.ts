export type BookingStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "refunded";

export type UserRole = "owner" | "admin" | "staff";

export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  notificationEmail?: string | null; // Email para recibir notificaciones de reservas
  address: string | null;
  timezone: string;
  active: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  active: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  // Payment fields (optional — only set when price > 0)
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string; // MP preference ID
  paymentExternalId?: string;   // MP payment ID from webhook
}
