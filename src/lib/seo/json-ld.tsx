import type { ReactElement } from "react";

import { getSiteWhatsAppPhoneForSchema, siteContact } from "@/lib/contact";
import { safeJsonLdStringify } from "@/lib/seo/safe-json-ld";
import { siteConfig } from "@/lib/seo/metadata";
import { SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";

export function OrganizationJsonLd(): ReactElement {
  const logoUrl = `${siteConfig.url}/icon-512x512.png`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
    image: logoUrl,
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
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
    />
  );
}

export function SoftwareApplicationJsonLd({
  name = siteConfig.name,
  description = siteConfig.description,
  url = siteConfig.url,
}: {
  name?: string;
  description?: string;
  url?: string;
} = {}): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: String(SUBSCRIPTION_USD_PRICE),
      priceCurrency: "USD",
    },
    description,
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
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
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
    />
  );
}

// WebSiteJsonLd sin SearchAction — /buscar no existe
export function WebSiteJsonLd(): ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
    />
  );
}
