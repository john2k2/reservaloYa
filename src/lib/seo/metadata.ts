import type { Metadata, Viewport } from "next";

import { getPublicAppUrl } from "@/lib/runtime";

const siteUrl = getPublicAppUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const siteConfig = {
  name: "ReservaYa",
  description:
    "ReservaYa ordena turnos para barberias, peluquerias y centros de estetica con una demo simple, clara y vendible.",
  url: siteUrl,
  ogImage: `${siteUrl}/icon-512x512.png`,
  links: {
    whatsapp: "https://wa.me/541155550199",
  },
  keywords: [
    "turnos online",
    "reservas",
    "barberia",
    "peluqueria",
    "estetica",
    "agenda online",
    "sistema de turnos",
    "reserva de citas",
    "software para barberias",
    "software para esteticas",
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
    default: `${siteConfig.name} | Turnos online para negocios chicos`,
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
        width: 512,
        height: 512,
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
    icon: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  verification: googleVerification ? { google: googleVerification } : undefined,
  alternates: {
    canonical: siteConfig.url,
  },
};

export const defaultViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
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
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const url = `${siteConfig.url}${path}`;

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
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage || siteConfig.ogImage,
          width: 512,
          height: 512,
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
