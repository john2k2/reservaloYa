import { describe, it, expect } from "vitest";
import { generateBusinessMetadata, generateBookingMetadata, generateBusinessKeywords } from "./business-metadata";

describe("generateBusinessMetadata", () => {
  it("genera metadatos base con title y description", () => {
    const meta = generateBusinessMetadata({
      businessName: "Aura Studio",
      slug: "aura-studio",
      description: "Barbería premium en Palermo",
    });

    expect(meta.title).toBe("Aura Studio | Reserva tu turno online");
    expect(meta.description).toBe("Barbería premium en Palermo");
    expect(meta.alternates?.canonical).toEqual(expect.stringContaining("/aura-studio"));
  });

  it("trunca descripciones largas", () => {
    const long = "a".repeat(200);
    const meta = generateBusinessMetadata({
      businessName: "Test",
      slug: "test",
      description: long,
    });

    expect(String(meta.description).length).toBeLessThanOrEqual(155);
  });

  it("no incluye openGraph.images ni twitter.images", () => {
    const meta = generateBusinessMetadata({
      businessName: "Test",
      slug: "test",
    });

    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.twitter).toBeDefined();
    expect(meta.twitter?.images).toBeUndefined();
  });

  it("incluye robots index follow", () => {
    const meta = generateBusinessMetadata({
      businessName: "Test",
      slug: "test",
    });

    expect(meta.robots).toEqual({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    });
  });

  it("incluye metatags de contacto del negocio", () => {
    const meta = generateBusinessMetadata({
      businessName: "Test",
      slug: "test",
      address: "Honduras 4821, Palermo",
      phone: "+54 11 5555 0000",
    });

    expect(meta.other).toMatchObject({
      "business:contact_data:street_address": "Honduras 4821, Palermo",
      "business:contact_data:phone_number": "+54 11 5555 0000",
      "business:contact_data:website": expect.stringContaining("/test"),
    });
  });
});

describe("generateBookingMetadata", () => {
  it("genera metadatos de reserva con robots index false", () => {
    const meta = generateBookingMetadata({
      businessName: "Aura Studio",
      slug: "aura-studio",
      serviceName: "Corte de pelo",
    });

    expect(meta.title).toBe("Reservar Corte de pelo | Aura Studio");
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.openGraph?.images).toBeDefined();
  });

  it("usa titulo generico cuando no hay servicio", () => {
    const meta = generateBookingMetadata({
      businessName: "Aura Studio",
      slug: "aura-studio",
    });

    expect(meta.title).toBe("Reservar turno | Aura Studio");
  });
});

describe("generateBusinessKeywords", () => {
  it("genera keywords base y de categoria", () => {
    const keywords = generateBusinessKeywords("Aura Studio", "barberia", ["Corte", "Barba"]);

    expect(keywords).toContain("Aura Studio");
    expect(keywords).toContain("barbería");
    expect(keywords).toContain("corte de pelo");
    expect(keywords).toContain("reservar corte");
    expect(keywords).toContain("turno barba");
  });

  it("no duplica keywords", () => {
    const keywords = generateBusinessKeywords("Aura", "barberia", ["Corte"]);
    const set = new Set(keywords);
    expect(set.size).toBe(keywords.length);
  });
});
