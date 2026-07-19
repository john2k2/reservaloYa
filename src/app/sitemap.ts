import type { MetadataRoute } from "next";

import { seoLandingPages } from "@/constants/seo-landing-pages";
import { isDemoBusiness } from "@/constants/demo";
import { siteConfig } from "@/lib/seo/metadata";
import { getPublicBusinessSitemapEntries } from "@/server/queries/public";

// Revalidar el sitemap una vez por día; estable para evitar regeneraciones frecuentes
export const revalidate = 86400;

const staticRoutes = [
  "",
  "/sobre-reservaya",
  "/contacto",
  "/precios",
  "/funcionalidades",
  "/como-funciona",
  "/preguntas-frecuentes",
  "/terminos",
  "/privacidad",
];
const seoRoutes = seoLandingPages.map((page) => `/${page.slug}`);

type SitemapBusinessRoute = {
  path: string;
  lastModified?: Date;
};

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseLastModified(updated: unknown): Date | undefined {
  if (!updated) return undefined;
  const d = new Date(updated as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function getIndexableBusinessRoutes(): Promise<SitemapBusinessRoute[]> {
  try {
    const businesses = await getPublicBusinessSitemapEntries();

    return businesses
      .filter((business) => isValidSlug(business.slug) && !isDemoBusiness(business.slug))
      .map((business) => ({
        path: `/${business.slug}`,
        lastModified: parseLastModified(business.updated),
      }));
  } catch (error) {
    console.warn("No se pudieron cargar negocios públicos para el sitemap", error);
    return [];
  }
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
