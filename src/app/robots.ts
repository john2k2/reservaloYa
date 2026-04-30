import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/platform/",
          "/api/",
          "/auth/",
          "/login",
          "/*/reservar",
          "/*/mi-turno/",
          "/*/confirmacion",
          "/*/resena",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
