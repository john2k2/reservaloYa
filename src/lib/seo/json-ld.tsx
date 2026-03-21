import type { ReactElement } from "react";

import { getSiteWhatsAppPhoneForSchema, siteContact } from "@/lib/contact";
import { siteConfig } from "@/lib/seo/metadata";

type OpeningHoursInput = Array<{
  days: string[];
  opens: string;
  closes: string;
}>;

export function OrganizationJsonLd(): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: siteConfig.ogImage,
    description: siteConfig.description,
    contactPoint: {
      "@type": "ContactPoint",
      email: siteContact.email,
      telephone: getSiteWhatsAppPhoneForSchema(),
      contactType: "customer service",
      availableLanguage: ["Spanish"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationJsonLd(): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "20",
      priceCurrency: "USD",
    },
    description: siteConfig.description,
    url: siteConfig.url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessJsonLd({
  name,
  description,
  url,
  telephone,
  address,
  openingHours,
  image,
}: {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
  };
  openingHours?: OpeningHoursInput;
  image?: string;
}): ReactElement {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    telephone,
    image,
  };

  if (address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.region,
      addressCountry: address.country,
    };
  }

  if (openingHours) {
    schema.openingHoursSpecification = openingHours.map((item) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: item.days,
      opens: item.opens,
      closes: item.closes,
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQPageJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}): ReactElement {
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

export function WebSiteJsonLd(): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
