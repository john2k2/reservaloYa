import { describe, it, expect } from "vitest";
import { createPageMetadata } from "./metadata";

describe("createPageMetadata", () => {
  it("genera metadatos con title, description y canonical", () => {
    const meta = createPageMetadata({
      title: "Contacto comercial",
      description: "Contactá a ReservaYa para consultar por turnos online.",
      path: "/contacto",
    });

    expect(meta.title).toBe("Contacto comercial");
    expect(meta.description).toBe("Contactá a ReservaYa para consultar por turnos online.");
    expect(meta.alternates?.canonical).toEqual(expect.stringContaining("/contacto"));
    expect(meta.openGraph?.title).toBe("Contacto comercial | ReservaYa");
  });

  it("no hereda keywords globales si no se pasan", () => {
    const meta = createPageMetadata({
      title: "Test",
      description: "Test desc",
      path: "/test",
    });

    expect(meta.keywords).toBeUndefined();
  });

  it("incluye openGraph y twitter con ogImage por defecto", () => {
    const meta = createPageMetadata({
      title: "Test",
      description: "Test desc",
      path: "/test",
    });

    expect(meta.openGraph).toBeDefined();
    expect(meta.twitter).toBeDefined();
    expect(meta.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 1200,
          height: 630,
        }),
      ])
    );
  });

  it("usa ogImage custom cuando se pasa", () => {
    const meta = createPageMetadata({
      title: "Test",
      description: "Test desc",
      path: "/test",
      ogImage: "https://example.com/custom.png",
    });

    expect(meta.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://example.com/custom.png",
        }),
      ])
    );
  });

  it("incluye keywords cuando se pasan", () => {
    const meta = createPageMetadata({
      title: "Test",
      description: "Test desc",
      path: "/test",
      keywords: ["turnos", "agenda"],
    });

    expect(meta.keywords).toEqual(["turnos", "agenda"]);
  });
});
