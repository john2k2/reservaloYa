import type { ReactElement } from "react";

const DAY_OF_WEEK_SCHEMA: Record<string, string> = {
  Domingo: "Sunday",
  Lunes: "Monday",
  Martes: "Tuesday",
  Miércoles: "Wednesday",
  Jueves: "Thursday",
  Viernes: "Friday",
  Sábado: "Saturday",
};

function toSchemaDay(spanishDay: string): string {
  return DAY_OF_WEEK_SCHEMA[spanishDay] ?? spanishDay;
}

interface LocalBusinessJsonLdProps {
  name: string;
  description: string;
  url: string;
  telephone?: string | null;
  address?: string | null;
  image?: string | null;
  priceRange?: string;
  openingHours?: Array<{
    day: string;
    opens: string;
    closes: string;
  }>;
  geo?: {
    latitude: number;
    longitude: number;
  };
  services?: string[];
  rating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

/**
 * JSON-LD para LocalBusiness - Mejora el SEO local en Google
 */
export function LocalBusinessJsonLd({
  name,
  description,
  url,
  telephone,
  address,
  image,
  priceRange = "$$",
  openingHours,
  geo,
  services = [],
  rating,
}: LocalBusinessJsonLdProps): ReactElement {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    telephone: telephone || undefined,
    image: image || undefined,
    priceRange,
  };

  if (address) {
    // Parsear dirección simple
    const parts = address.split(",").map((p) => p.trim());
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: parts[0] || address,
      addressLocality: parts[1] || "",
      addressRegion: parts[2] || "",
      addressCountry: "AR",
    };
  }

  if (geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: geo.latitude,
      longitude: geo.longitude,
    };
  }

  if (openingHours && openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: toSchemaDay(h.day),
      opens: h.opens,
      closes: h.closes,
    }));
  }

  if (services.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Servicios",
      itemListElement: services.map((service, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service,
        },
        position: index + 1,
      })),
    };
  }

  if (rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.ratingValue,
      reviewCount: rating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ServiceJsonLdProps {
  businessName: string;
  businessUrl: string;
  serviceName: string;
  description: string;
  price?: string;
  duration?: string; // ISO 8601 duration format, e.g., "PT30M"
  image?: string;
}

/**
 * JSON-LD para un servicio específico - Ideal para SEO de servicios
 */
export function ServiceJsonLd({
  businessName,
  businessUrl,
  serviceName,
  description,
  price,
  duration,
  image,
}: ServiceJsonLdProps): ReactElement {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description,
    provider: {
      "@type": "LocalBusiness",
      name: businessName,
      url: businessUrl,
    },
  };

  if (price) {
    schema.offers = {
      "@type": "Offer",
      price,
      priceCurrency: "ARS",
      availability: "https://schema.org/InStock",
    };
  }

  if (duration) {
    schema.timeRequired = duration;
  }

  if (image) {
    schema.image = image;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebPageJsonLdProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

/**
 * JSON-LD para WebPage - Estructura básica de página
 */
export function WebPageJsonLd({
  name,
  description,
  url,
  image,
  datePublished,
  dateModified,
}: WebPageJsonLdProps): ReactElement {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
  };

  if (image) {
    schema.primaryImageOfPage = {
      "@type": "ImageObject",
      url: image,
    };
  }

  if (datePublished) {
    schema.datePublished = datePublished;
  }

  if (dateModified) {
    schema.dateModified = dateModified;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * JSON-LD para BreadcrumbList - Mejora la navegación en Google
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQJsonLdProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * JSON-LD para FAQPage - Para preguntas frecuentes
 */
export function FAQJsonLd({ faqs }: FAQJsonLdProps): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
