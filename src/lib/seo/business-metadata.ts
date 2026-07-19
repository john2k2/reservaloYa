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
}

/**
 * Genera metadatos SEO para la página pública de un negocio.
 * Nota: openGraph.images y twitter.images se omiten cuando el segmento
 * de ruta tiene opengraph-image.tsx / twitter-image.tsx (Next.js los descubre automáticamente).
 */
export function generateBusinessMetadata({
  businessName,
  slug,
  description,
  address,
  phone,
}: BusinessMetadataInput): Metadata {
  const url = `${siteUrl}/${slug}`;
  const title = `${businessName} | Reservá tu turno online`;
  const metaDescription = truncateSeoDescription(
    description ||
      `Reservá tu turno en ${businessName}. Agenda online disponible 24/7. Confirmación inmediata.`
  );

  return {
    title: { absolute: title },
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
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
    title: { absolute: title },
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
      // Sin images: el segmento [slug] ya tiene opengraph-image.tsx 1200×630
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Metadata para flujos no indexables (confirmación, mi turno, reseña).
 * Evita heredar canonical/OG de la homepage.
 */
export function generateTransactionalMetadata({
  businessName,
  slug,
  pathSuffix,
  titlePrefix,
}: {
  businessName?: string | null;
  slug: string;
  pathSuffix: "/confirmacion" | "/mi-turno" | "/resena";
  titlePrefix: string;
}): Metadata {
  const url = `${siteUrl}/${slug}${pathSuffix}`;
  const title = businessName ? `${titlePrefix} | ${businessName}` : titlePrefix;
  const description = businessName
    ? `${titlePrefix} de ${businessName}. Página privada de gestión del turno.`
    : `${titlePrefix}. Página privada de gestión del turno.`;

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title,
      description,
      siteName: businessName || "ReservaYa",
    },
    twitter: {
      card: "summary",
      title,
      description,
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
