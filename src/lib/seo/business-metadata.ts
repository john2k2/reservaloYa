import type { Metadata } from "next";
import { getPublicAppUrl } from "@/lib/runtime";

const siteUrl = getPublicAppUrl();

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
  const metaDescription =
    description ||
    `Reserva tu turno en ${businessName}. Agenda online disponible 24/7. Confirmación inmediata.`;
  const ogImage = image || `${siteUrl}/icon-512x512.png`;

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical: url,
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
  const description = `Reserva tu turno en ${businessName}. Selecciona fecha, horario y servicio. Confirmación inmediata.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title,
      description,
      siteName: businessName,
    },
    robots: {
      index: false,
      follow: false,
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
