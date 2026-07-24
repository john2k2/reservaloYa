export type BookingStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "refunded";

export type UserRole = "owner" | "admin" | "staff";

/**
 * Shape base compartido por las distintas vistas de un servicio en la UI
 * (selector de reserva pública, formulario de turno manual, etc.). Donde se
 * necesiten campos extra, componer con intersección en vez de extender este
 * tipo (ej. `ServiceSummary & { description: string }`).
 */
export type ServiceSummary = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};
