import { describe, it, expect } from "vitest";
import { LocalBusinessJsonLd, ServiceJsonLd, FAQJsonLd, BreadcrumbJsonLd, WebPageJsonLd } from "./business-json-ld";
import { renderToStaticMarkup } from "react-dom/server";

describe("LocalBusinessJsonLd", () => {
  it("renderiza schema LocalBusiness con datos base", () => {
    const el = LocalBusinessJsonLd({
      name: "Aura Studio",
      description: "Barbería premium",
      url: "https://reservaya.app/aura-studio",
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("LocalBusiness");
    expect(html).toContain("Aura Studio");
    expect(html).toContain("Barbería premium");
  });

  it("incluye geo cuando se pasa", () => {
    const el = LocalBusinessJsonLd({
      name: "Aura Studio",
      description: "Barbería premium",
      url: "https://reservaya.app/aura-studio",
      geo: { latitude: -34.6, longitude: -58.4 },
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("GeoCoordinates");
    expect(html).toContain("-34.6");
    expect(html).toContain("-58.4");
  });

  it("incluye aggregateRating cuando se pasa rating", () => {
    const el = LocalBusinessJsonLd({
      name: "Aura Studio",
      description: "Barbería premium",
      url: "https://reservaya.app/aura-studio",
      rating: { ratingValue: 4.8, reviewCount: 12 },
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("AggregateRating");
    expect(html).toContain("4.8");
    expect(html).toContain("12");
  });

  it("incluye reviews cuando se pasan", () => {
    const el = LocalBusinessJsonLd({
      name: "Aura Studio",
      description: "Barbería premium",
      url: "https://reservaya.app/aura-studio",
      reviews: [
        { author: "Juan", reviewRating: 5, reviewBody: "Excelente", datePublished: "2024-01-01" },
      ],
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("Review");
    expect(html).toContain("Juan");
    expect(html).toContain("Excelente");
  });
});

describe("ServiceJsonLd", () => {
  it("renderiza schema Service con provider", () => {
    const el = ServiceJsonLd({
      businessName: "Aura Studio",
      businessUrl: "https://reservaya.app/aura-studio",
      serviceName: "Corte",
      description: "Corte de pelo",
      price: "$ 5000",
      duration: "PT30M",
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("Service");
    expect(html).toContain("Corte");
    expect(html).toContain("5000");
  });
});

describe("FAQJsonLd", () => {
  it("renderiza FAQPage con preguntas", () => {
    const el = FAQJsonLd({
      faqs: [{ question: "¿Aceptan tarjeta?", answer: "Sí" }],
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("FAQPage");
    expect(html).toContain("¿Aceptan tarjeta?");
  });
});

describe("BreadcrumbJsonLd", () => {
  it("renderiza BreadcrumbList", () => {
    const el = BreadcrumbJsonLd({
      items: [
        { name: "Inicio", url: "https://reservaya.app" },
        { name: "Aura", url: "https://reservaya.app/aura" },
      ],
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("BreadcrumbList");
    expect(html).toContain("Inicio");
  });
});

describe("WebPageJsonLd", () => {
  it("renderiza WebPage con fechas", () => {
    const el = WebPageJsonLd({
      name: "Aura Studio",
      description: "Barbería premium",
      url: "https://reservaya.app/aura-studio",
      datePublished: "2024-01-01",
      dateModified: "2024-06-01",
    });
    const html = renderToStaticMarkup(el);
    expect(html).toContain("WebPage");
    expect(html).toContain("2024-01-01");
    expect(html).toContain("2024-06-01");
  });
});
