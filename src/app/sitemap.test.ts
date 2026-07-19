import { describe, it, expect, vi, beforeEach } from "vitest";
import sitemap from "./sitemap";
import { siteConfig } from "@/lib/seo/metadata";

const mockGetEntries = vi.fn();

vi.mock("@/server/queries/public", () => ({
  getPublicBusinessSitemapEntries: () => mockGetEntries(),
}));

beforeEach(() => {
  mockGetEntries.mockResolvedValue([]);
});

describe("sitemap — rutas de marketing", () => {
  it("devuelve rutas estáticas aunque la query de negocios falle", async () => {
    mockGetEntries.mockRejectedValue(new Error("DB error"));

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toContain(siteConfig.url);
    expect(urls).toContain(`${siteConfig.url}/contacto`);
    expect(urls).toContain(`${siteConfig.url}/sobre-reservaya`);
    expect(urls).toContain(`${siteConfig.url}/precios`);
    expect(urls).toContain(`${siteConfig.url}/funcionalidades`);
    expect(urls).toContain(`${siteConfig.url}/como-funciona`);
    expect(urls).toContain(`${siteConfig.url}/preguntas-frecuentes`);
    expect(urls).toContain(`${siteConfig.url}/terminos`);
    expect(urls).toContain(`${siteConfig.url}/privacidad`);
    expect(urls).not.toContain(`${siteConfig.url}/about`);
  });

  it("devuelve rutas estáticas cuando no hay negocios", async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toContain(siteConfig.url);
    expect(urls).toContain(`${siteConfig.url}/contacto`);
  });

  it("incluye landings SEO por rubro", async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toContain(`${siteConfig.url}/turnos-online-barberias`);
    expect(urls).toContain(`${siteConfig.url}/turnos-online-nails`);
    expect(urls).toContain(`${siteConfig.url}/turnos-online-consultorios`);
  });

  it("asigna prioridad 1 a la home", async () => {
    const result = await sitemap();
    const home = result.find((r) => r.url === siteConfig.url);
    expect(home?.priority).toBe(1);
  });
});

describe("sitemap — negocios reales", () => {
  it("incluye un negocio real con fecha válida", async () => {
    const updated = "2026-05-10T12:00:00.000Z";
    mockGetEntries.mockResolvedValue([{ slug: "mi-peluqueria", updated }]);

    const result = await sitemap();
    const entry = result.find((r) => r.url === `${siteConfig.url}/mi-peluqueria`);

    expect(entry).toBeDefined();
    expect(entry?.lastModified).toEqual(new Date(updated));
    expect(entry?.changeFrequency).toBe("weekly");
    expect(entry?.priority).toBe(0.8);
  });

  it("incluye negocio real sin fecha (usa fecha actual como fallback)", async () => {
    mockGetEntries.mockResolvedValue([{ slug: "salon-belen", updated: null }]);

    const before = Date.now();
    const result = await sitemap();
    const after = Date.now();

    const entry = result.find((r) => r.url === `${siteConfig.url}/salon-belen`);
    expect(entry).toBeDefined();
    const ts = (entry!.lastModified as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("ignora negocios con fecha inválida (usa fecha actual como fallback)", async () => {
    mockGetEntries.mockResolvedValue([
      { slug: "negocio-ok", updated: "not-a-date" },
    ]);

    const before = Date.now();
    const result = await sitemap();
    const after = Date.now();

    const entry = result.find((r) => r.url === `${siteConfig.url}/negocio-ok`);
    expect(entry).toBeDefined();
    const ts = (entry!.lastModified as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("excluye slugs vacíos o inválidos", async () => {
    mockGetEntries.mockResolvedValue([
      { slug: "", updated: null },
      { slug: "   ", updated: null },
      { slug: "ruta/invalida", updated: null },
      { slug: "Mayusculas", updated: null },
    ]);

    const result = await sitemap();
    // Solo marketing routes, ningún negocio
    const businessUrls = result.filter(
      (r) => r.changeFrequency === "weekly"
    );
    expect(businessUrls).toHaveLength(0);
  });
});

describe("sitemap — exclusión de demos", () => {
  it("excluye negocios con slug demo aunque vengan de la DB", async () => {
    mockGetEntries.mockResolvedValue([
      { slug: "demo-barberia", updated: "2026-01-01T00:00:00Z" },
      { slug: "demo-estetica", updated: "2026-01-01T00:00:00Z" },
      { slug: "demo-nails", updated: "2026-01-01T00:00:00Z" },
      { slug: "demo-consultorio", updated: "2026-01-01T00:00:00Z" },
      { slug: "negocio-real", updated: "2026-01-01T00:00:00Z" },
    ]);

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).not.toContain(`${siteConfig.url}/demo-barberia`);
    expect(urls).not.toContain(`${siteConfig.url}/demo-estetica`);
    expect(urls).not.toContain(`${siteConfig.url}/demo-nails`);
    expect(urls).not.toContain(`${siteConfig.url}/demo-consultorio`);
    expect(urls).toContain(`${siteConfig.url}/negocio-real`);
  });

  it("no incluye demos como fallback cuando la query devuelve vacío", async () => {
    mockGetEntries.mockResolvedValue([]);

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls.some((u) => u.includes("/demo-"))).toBe(false);
  });

  it("no incluye demos como fallback cuando la query falla", async () => {
    mockGetEntries.mockRejectedValue(new Error("timeout"));

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls.some((u) => u.includes("/demo-"))).toBe(false);
  });
});
