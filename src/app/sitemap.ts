import type { MetadataRoute } from "next";

import { seoLandingPages } from "@/constants/seo-landing-pages";
import { demoBusinessOptions } from "@/constants/site";
import { siteConfig } from "@/lib/seo/metadata";
import { getPublicBusinessSitemapEntries } from "@/server/queries/public";

const staticRoutes = ["", "/terminos", "/privacidad"];
const seoRoutes = seoLandingPages.map((page) => `/${page.slug}`);

type SitemapBusinessRoute = {
  path: string;
  lastModified?: Date;
};

async function getIndexableBusinessRoutes(): Promise<SitemapBusinessRoute[]> {
  try {
    const businesses = await getPublicBusinessSitemapEntries();

    if (businesses.length > 0) {
      return businesses.map((business) => ({
        path: `/${business.slug}`,
        lastModified: business.updated ? new Date(business.updated) : undefined,
      }));
    }
  } catch (error) {
    console.warn("No se pudieron cargar negocios públicos para el sitemap", error);
  }

  return demoBusinessOptions.map(({ slug }) => ({ path: `/${slug}` }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Solo páginas públicas indexables — /reservar y otras páginas transaccionales quedan fuera
  const businessRoutes = await getIndexableBusinessRoutes();

  const marketingRoutes = [...staticRoutes, ...seoRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : seoRoutes.includes(path) ? 0.9 : 0.8,
  }));

  const publicBusinessRoutes = businessRoutes.map(({ path, lastModified }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: lastModified ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...marketingRoutes, ...publicBusinessRoutes];
}
