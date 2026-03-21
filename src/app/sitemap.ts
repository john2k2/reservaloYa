import type { MetadataRoute } from "next";

import { demoBusinessOptions } from "@/constants/site";
import { siteConfig } from "@/lib/seo/metadata";

const staticRoutes = ["", "/terminos", "/privacidad"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const exampleRoutes = demoBusinessOptions.flatMap(({ slug }) => [`/${slug}`, `/${slug}/reservar`]);

  return [...staticRoutes, ...exampleRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path.includes("/reservar") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.includes("/reservar") ? 0.7 : 0.8,
  }));
}
