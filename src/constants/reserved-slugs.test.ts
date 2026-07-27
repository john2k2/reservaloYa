import { describe, expect, it } from "vitest";

import { isReservedSlug, reservedSlugs } from "./reserved-slugs";
import { seoLandingPages } from "./seo-landing-pages";

describe("reservedSlugs", () => {
  it("includes the app route segments that would shadow a business page", () => {
    for (const segment of ["admin", "api", "auth", "consulta", "login", "platform"]) {
      expect(reservedSlugs).toContain(segment);
    }
  });

  it("includes the marketing routes", () => {
    for (const segment of [
      "como-funciona",
      "contacto",
      "funcionalidades",
      "precios",
      "preguntas-frecuentes",
      "privacidad",
      "sobre-reservaya",
      "terminos",
    ]) {
      expect(reservedSlugs).toContain(segment);
    }
  });

  it("includes redirect sources so a business cannot claim them", () => {
    for (const segment of ["about", "dashboard", "panel"]) {
      expect(reservedSlugs).toContain(segment);
    }
  });

  it("stays in sync with the SEO landing pages", () => {
    for (const page of seoLandingPages) {
      expect(reservedSlugs).toContain(page.slug);
    }
  });

  it("includes well-known files served from the root", () => {
    for (const file of ["favicon.ico", "robots.txt", "sitemap.xml"]) {
      expect(reservedSlugs).toContain(file);
    }
  });
});

describe("isReservedSlug", () => {
  it("detects reserved slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("precios")).toBe(true);
    expect(isReservedSlug("turnos-online-barberias")).toBe(true);
  });

  it("allows regular business slugs", () => {
    expect(isReservedSlug("mi-barberia")).toBe(false);
    expect(isReservedSlug("aura-studio-palermo")).toBe(false);
  });

  it("ignores casing and surrounding whitespace", () => {
    expect(isReservedSlug("  ADMIN  ")).toBe(true);
    expect(isReservedSlug("Precios")).toBe(true);
  });

  it("treats an empty value as not reserved (callers validate emptiness separately)", () => {
    expect(isReservedSlug("")).toBe(false);
  });
});
