import { describe, expect, it } from "vitest";

import { resolvePublicTrustPoints } from "@/constants/public-business-profiles";

describe("resolvePublicTrustPoints", () => {
  it("keeps template chips for demo businesses and swaps location", () => {
    const points = resolvePublicTrustPoints({
      isDemo: true,
      profileTrustPoints: [
        "Atención puntual",
        "Ubicación en Palermo",
        "Horarios visibles antes de reservar",
      ],
      businessSlug: "demo-barberia",
      businessName: "Barbería Demo",
      templateSlug: "demo-barberia",
      shortAddressLabel: "Belgrano",
    });

    expect(points).toEqual([
      "Atención puntual",
      "Ubicación en Belgrano",
      "Horarios visibles antes de reservar",
    ]);
  });

  it("hides template defaults for real businesses", () => {
    const points = resolvePublicTrustPoints({
      isDemo: false,
      profileTrustPoints: [
        "Atención puntual",
        "Ubicación en Palermo",
        "Horarios visibles antes de reservar",
      ],
      businessSlug: "mi-barberia",
      businessName: "Mi Barbería",
      templateSlug: "demo-barberia",
      shortAddressLabel: "Caballito",
    });

    expect(points).toEqual([]);
  });

  it("keeps customized trust points for real businesses", () => {
    const points = resolvePublicTrustPoints({
      isDemo: false,
      profileTrustPoints: ["Cortes desde $8.000", "Estacionamiento gratis"],
      businessSlug: "mi-barberia",
      businessName: "Mi Barbería",
      templateSlug: "demo-barberia",
      shortAddressLabel: "Caballito",
    });

    expect(points).toEqual(["Cortes desde $8.000", "Estacionamiento gratis"]);
  });
});
