import { describe, it, expect, vi } from "vitest";
import sitemap from "./sitemap";
import { siteConfig } from "@/lib/seo/metadata";

vi.mock("@/server/queries/public", () => ({
  getPublicBusinessSitemapEntries: vi.fn().mockResolvedValue([]),
}));

describe("sitemap", () => {
  it("devuelve rutas estáticas y de marketing", async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toContain(siteConfig.url);
    expect(urls).toContain(`${siteConfig.url}/contacto`);
    expect(urls).toContain(`${siteConfig.url}/sobre-reservaya`);
    expect(urls).toContain(`${siteConfig.url}/terminos`);
    expect(urls).toContain(`${siteConfig.url}/privacidad`);
  });

  it("incluye rutas de negocios demo cuando no hay datos", async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls.some((u) => u.includes("/demo-"))).toBe(true);
  });

  it("asigna prioridad 1 a la home", async () => {
    const result = await sitemap();
    const home = result.find((r) => r.url === siteConfig.url);
    expect(home?.priority).toBe(1);
  });
});
