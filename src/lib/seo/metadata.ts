import type { Metadata, Viewport } from "next";

import { getSiteWhatsAppHref } from "@/lib/contact";
import { getPublicAppUrl } from "@/lib/runtime";

const siteUrl = getPublicAppUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const siteConfig = {
  name: "ReservaYa",
  description:
    "Sistema de turnos online para barberías, peluquerías y centros de estética. Automatizá reservas, agenda, clientes y recordatorios con ReservaYa.",
  url: siteUrl,
  ogImage: `${siteUrl}/og-image.png`,
  links: {
    whatsapp: getSiteWhatsAppHref(),
  },
  keywords: [
    "turnos online",
    "sistema de turnos online",
    "sistema de reservas online",
    "reservas",
    "agenda online",
    "software de reservas",
    "software para barberías",
    "software para peluquerías",
    "software para centros de estética",
    "reservas online Argentina",
    "agenda para negocios de servicios",
    "barbería",
    "peluquería",
    "estética",
    "sistema de turnos",
    "reserva de citas",
    "software para barberías",
    "software para estéticas",
  ],
  authors: [
    {
      name: "ReservaYa",
      url: siteUrl,
    },
  ],
  creator: "ReservaYa",
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Turnos online para barberías y estética",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/reservaya-isotype.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  verification: googleVerification ? { google: googleVerification } : undefined,
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "x-default": siteConfig.url,
      "es-AR": siteConfig.url,
    },
  },
};

export const defaultViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export function createPageMetadata({
  title,
  description,
  path,
  ogImage,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    keywords,
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
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage || siteConfig.ogImage],
    },
  };
}
