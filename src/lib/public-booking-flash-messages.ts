const EXACT_MESSAGES = new Set([
  "Completa los datos del turno.",
  "Link de gestion invalido.",
  "No pudimos iniciar el pago online. Intenta nuevamente en unos minutos o contacta al negocio.",
  "No se pudo crear la reserva.",
  "No se pudo cancelar el turno.",
  "Negocio no encontrado.",
  "Servicio no encontrado.",
  "Ese horario queda fuera de la disponibilidad configurada.",
  "Ese horario esta bloqueado.",
  "Ese horario ya no esta disponible.",
  "Este turno ya no se puede reprogramar.",
  "Este turno ya no se puede cancelar.",
]);

const ALLOWED_PREFIXES = [
  "Demasiados intentos de reserva",
  "No se pudieron cargar los horarios",
];

const MAX_FLASH_MESSAGE_LENGTH = 200;

const GENERIC_FLASH_MESSAGE =
  "No pudimos completar la acción. Intentá de nuevo o contactá al negocio.";

export function resolvePublicBookingFlashMessage(raw: string | undefined | null): string {
  if (!raw) return "";

  const trimmed = raw.trim().slice(0, MAX_FLASH_MESSAGE_LENGTH);
  if (!trimmed) return "";

  if (EXACT_MESSAGES.has(trimmed)) {
    return trimmed;
  }

  if (ALLOWED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed;
  }

  return GENERIC_FLASH_MESSAGE;
}
