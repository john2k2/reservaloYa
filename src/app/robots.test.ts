import { describe, expect, it } from "vitest";

import { siteConfig } from "@/lib/seo/metadata";
import robots from "./robots";

describe("robots", () => {
  it("bloquea rutas privadas y tokenizadas", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallow = rules.flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : []
    );

    expect(disallow).toContain("/consulta/");
    expect(disallow).toContain("/admin/");
    expect(disallow).toContain("/platform/");
  });

  it("publica el sitemap y host canónicos", () => {
    const result = robots();

    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(result.host).toBe(siteConfig.url);
  });
});
