/**
 * Constructores de URLs para la página pública de un negocio: redes sociales,
 * WhatsApp y el link interno a `/[slug]/reservar`. `buildBookingHref` es
 * compartido entre la landing pública (`page.tsx`, que solo usa `serviceId` +
 * UTMs) y la propia página de reserva (`reservar/page.tsx`, que además
 * encadena `bookingDate` y el flujo de reprogramación) — todos los campos
 * además de `slug` son opcionales para cubrir ambos casos.
 */

export function buildInstagramHref(handle?: string) {
  if (!handle) return null;
  if (handle.startsWith("http://") || handle.startsWith("https://")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function buildFacebookHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://facebook.com/${value.replace(/^@/, "")}`;
}

export function buildTikTokHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://www.tiktok.com/${value.startsWith("@") ? value : `@${value}`}`;
}

export function buildWhatsAppHref(phone?: string, businessName?: string): string | undefined {
  const normalizedPhone = phone?.replace(/\D/g, "");
  if (!normalizedPhone) return undefined;

  const message = businessName
    ? `Hola ${businessName}, quiero reservar un turno.`
    : "Hola, quiero reservar un turno.";

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildBookingHref(input: {
  slug: string;
  serviceId?: string;
  bookingDate?: string;
  rescheduleBookingId?: string;
  token?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  changeService?: boolean;
}) {
  const params = new URLSearchParams();
  if (input.serviceId) params.set("service", input.serviceId);
  if (input.bookingDate) params.set("date", input.bookingDate);
  if (input.rescheduleBookingId) params.set("reschedule", input.rescheduleBookingId);
  if (input.token) params.set("token", input.token);
  if (input.source) params.set("utm_source", input.source);
  if (input.medium) params.set("utm_medium", input.medium);
  if (input.campaign) params.set("utm_campaign", input.campaign);
  if (input.changeService) params.set("changeService", "1");
  const query = params.toString();
  return query ? `/${input.slug}/reservar?${query}` : `/${input.slug}/reservar`;
}
