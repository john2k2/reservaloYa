const defaultContactEmail = "hola@reservaya.ar";
const defaultWhatsAppNumber = "541124057521";

export const siteContact = {
  email: defaultContactEmail,
  businessHours: "Lun-Vie 9:00 a 18:00",
  whatsappLabel: "Atención comercial por WhatsApp",
} as const;

function getNormalizedWhatsAppNumber() {
  return defaultWhatsAppNumber.replace(/\D/g, "");
}

export function getSiteWhatsAppHref(message = "Hola, quiero conocer ReservaYa.") {
  return `https://wa.me/${getNormalizedWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

export function getSiteWhatsAppPhoneForSchema() {
  return `+${getNormalizedWhatsAppNumber()}`;
}
