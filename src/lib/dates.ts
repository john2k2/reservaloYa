/**
 * Formateo de fechas en español rioplatense (es-AR) para admin/platform.
 * Reemplaza las reimplementaciones locales de cada page.tsx (`formatDateLabel`,
 * `formatDate`, etc.), unificadas en un único helper con opciones.
 */

export interface FormatEsArDateOptions {
  /** Muestra el día de la semana abreviado (ej. "lun"). Default: false. */
  weekday?: boolean;
  /** Formato del mes: "2-digit" (07), "short" (jul) o "long" (julio). Default: "short". */
  month?: "2-digit" | "short" | "long";
  /** Muestra el año. Default: true. */
  year?: boolean;
  /**
   * Trata `date` como fecha pura "YYYY-MM-DD" (columnas `date`, sin hora) y la
   * fija a mediodía UTC antes de formatear. Sin esto, timezones negativos
   * (Argentina, UTC-3) muestran la fecha un día antes. Usalo para valores como
   * `bookingDate`/`blockedDate`, nunca para timestamps con hora. Default: false.
   */
  dateOnly?: boolean;
}

/** Formatea una fecha (sin hora) en es-AR, ej. "22/07/2026" o "lun, 22/07/2026". */
export function formatEsArDate(date: string, options: FormatEsArDateOptions = {}): string {
  const { weekday = false, month = "short", year = true, dateOnly = false } = options;
  const parsed = dateOnly ? new Date(`${date}T12:00:00Z`) : new Date(date);

  return new Intl.DateTimeFormat("es-AR", {
    ...(weekday ? { weekday: "short" as const } : {}),
    day: month === "2-digit" ? "2-digit" : "numeric",
    month,
    ...(year ? { year: "numeric" as const } : {}),
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(parsed);
}

/** Formatea una fecha con hora en es-AR, ej. "22 jul, 14:30". Para timestamps, nunca fechas puras. */
export function formatEsArDateTime(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
