import type { Metadata } from "next";
import { getPublicAppUrl } from "@/lib/runtime";

const siteUrl = getPublicAppUrl();

function truncateSeoDescription(description: string, maxLength = 155) {
  if (description.length <= maxLength) return description;
  const clipped = description.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 100 ? lastSpace : clipped.length).trimEnd()}…`;
}

interface BusinessMetadataInput {
  businessName: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  image?: string | null;
  category?: string;
}

/**
 * Genera metadatos SEO para la página pública de un negocio
 */
export function generateBusinessMetadata({
  businessName,
  slug,
  description,
  address,
  phone,
  image,
  category = "LocalBusiness",
}: BusinessMetadataInput): Metadata {
  const url = `${siteUrl}/${slug}`;
  const title = `${businessName} | Reserva tu turno online`;
  const metaDescription = truncateSeoDescription(
    description ||
      `Reserva tu turno en ${businessName}. Agenda online disponible 24/7. Confirmación inmediata.`
  );
  const ogImage = image || `${siteUrl}/og-image.png`;

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical: url,
      languages: {
        "x-default": url,
        "es-AR": url,
      },
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title,
      description: metaDescription,
      siteName: businessName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${businessName} - ${category}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "business:contact_data:street_address": address || "",
      "business:contact_data:phone_number": phone || "",
      "business:contact_data:website": url,
    },
  };
}

/**
 * Genera metadatos para la página de reserva de un negocio
 */
export function generateBookingMetadata({
  businessName,
  slug,
  serviceName,
}: {
  businessName: string;
  slug: string;
  serviceName?: string;
}): Metadata {
  const url = `${siteUrl}/${slug}/reservar`;
  const title = serviceName
    ? `Reservar ${serviceName} | ${businessName}`
    : `Reservar turno | ${businessName}`;
  const description = `Reservá tu turno en ${businessName}. Elegí fecha, horario y servicio con confirmación inmediata desde ReservaYa.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "x-default": url,
        "es-AR": url,
      },
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title,
      description,
      siteName: businessName,
      images: [
        {
          url: `${siteUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
          alt: `Reservas online para ${businessName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/icon-512x512.png`],
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Genera keywords relevantes para el negocio según su categoría
 */
export function generateBusinessKeywords(
  businessName: string,
  category?: string,
  services: string[] = []
): string[] {
  const baseKeywords = [
    businessName,
    "reserva de turnos",
    "agenda online",
    "turnos online",
    "reservas",
    businessName.toLowerCase(),
  ];

  const categoryKeywords: Record<string, string[]> = {
    barberia: [
      "barbería",
      "corte de pelo",
      "barba",
      "afeitado",
      "peluquería masculina",
      "estilista",
    ],
    peluqueria: [
      "peluquería",
      "corte de pelo",
      "tintura",
      "mechas",
      "peinado",
      "estilista",
      "coloración",
    ],
    estetica: [
      "centro de estética",
      "tratamientos faciales",
      "tratamientos corporales",
      "belleza",
      "spa",
      "masajes",
      "limpieza facial",
    ],
    manicuria: [
      "manicuría",
      "pedicuría",
      "uñas",
      "esmaltado",
      "semipermanente",
      "nail art",
    ],
  };

  const normalizedCategory = category?.toLowerCase().replace(/[áéíóú]/g, (c) =>
    ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" }[c] || c)
  );

  const categorySpecific = normalizedCategory
    ? categoryKeywords[normalizedCategory] || []
    : [];

  const serviceKeywords = services.flatMap((service) => [
    service,
    `reservar ${service.toLowerCase()}`,
    `turno ${service.toLowerCase()}`,
  ]);

  return [...new Set([...baseKeywords, ...categorySpecific, ...serviceKeywords])];
}
