import type { MetadataRoute } from "next";

import { seoLandingPages } from "@/constants/seo-landing-pages";
import { demoBusinessOptions } from "@/constants/site";
import { siteConfig } from "@/lib/seo/metadata";

const staticRoutes = ["", "/terminos", "/privacidad"];
const seoRoutes = seoLandingPages.map((page) => `/${page.slug}`);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Solo páginas públicas indexables — /reservar y otras páginas transaccionales quedan fuera
  const businessRoutes = demoBusinessOptions.map(({ slug }) => `/${slug}`);

  return [...staticRoutes, ...seoRoutes, ...businessRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : seoRoutes.includes(path) ? 0.9 : 0.8,
  }));
}
