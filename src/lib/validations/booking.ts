import { z } from "zod";

// Valida que un string YYYY-MM-DD sea una fecha de calendario real (no Feb 31, etc.)
function isRealCalendarDate(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(date.getTime())) return false;
  // Verifica que el día no fue corregido por el motor de fechas (ej: Feb 31 → Mar 3)
  return date.toISOString().startsWith(dateStr);
}

// Valida que la fecha no sea anterior a ayer (UTC), dando un día de margen por zona horaria
function isNotInThePast(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const bookingDate = new Date(`${dateStr}T00:00:00Z`);
  return bookingDate >= yesterday;
}

// Valida que HH:MM esté en rango válido (00:00–23:59)
function isValidTimeRange(timeStr: string): boolean {
  const [hh, mm] = timeStr.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export const publicBookingSchema = z.object({
  businessSlug: z.string().min(2).max(80),
  serviceId: z.string().min(1),
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha invalido.")
    .refine(isRealCalendarDate, "La fecha no existe en el calendario.")
    .refine(isNotInThePast, "No se pueden crear reservas en fechas pasadas."),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato de hora invalido.")
    .refine(isValidTimeRange, "La hora debe estar entre 00:00 y 23:59."),
  fullName: z.string().min(3).max(120),
  phone: z.union([z.string().min(6).max(30), z.literal("")]).optional(),
  email: z.string().email(),
  notes: z.union([z.string().max(500), z.literal("")]).optional(),
  rescheduleBookingId: z.union([z.string().min(1).max(64), z.literal("")]).optional(),
  manageToken: z.union([z.string().min(32), z.literal("")]).optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
