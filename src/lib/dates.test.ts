import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { formatEsArDate, formatEsArDateTime } from "./dates";

describe("formatEsArDate / formatEsArDateTime", () => {
  // Fija el TZ del proceso para que las aserciones sean deterministas sin
  // importar en qué timezone corra la máquina de CI/dev.
  let originalTz: string | undefined;

  beforeAll(() => {
    originalTz = process.env.TZ;
    process.env.TZ = "America/Argentina/Buenos_Aires";
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  describe("dateOnly: true (columnas `date` sin hora, ej. bookingDate/blockedDate)", () => {
    it("formatea con weekday + día/mes en 2 dígitos + año (bookings/availability)", () => {
      expect(
        formatEsArDate("2026-07-22", { weekday: true, month: "2-digit", dateOnly: true })
      ).toBe("mié, 22/07/2026");
    });

    it("formatea sin weekday (customers)", () => {
      expect(formatEsArDate("2026-07-22", { month: "2-digit", dateOnly: true })).toBe(
        "22/07/2026"
      );
    });

    it("ancla a mediodía UTC para que un timezone negativo no muestre el día anterior", () => {
      // Sin el anclaje a mediodía, "2026-07-01" se interpreta como
      // 2026-07-01T00:00:00Z, que en UTC-3 (Argentina) cae en 2026-06-30.
      expect(formatEsArDate("2026-07-01", { month: "2-digit", dateOnly: true })).toBe(
        "01/07/2026"
      );
    });
  });

  describe("dateOnly: false (timestamps, ej. created/trialEndsAt/nextBillingDate)", () => {
    it("usa los defaults (día numérico + mes corto + año) para createdAt", () => {
      expect(formatEsArDate("2026-07-22T15:30:00.000Z")).toBe("22 de jul de 2026");
    });

    it("omite el año cuando year: false (trial/próximo cobro)", () => {
      expect(formatEsArDate("2026-07-22T15:30:00.000Z", { year: false })).toBe("22 jul");
    });

    it("soporta mes largo para billing", () => {
      expect(formatEsArDate("2026-07-22T15:30:00.000Z", { month: "long" })).toBe(
        "22 de julio de 2026"
      );
    });
  });

  describe("formatEsArDateTime", () => {
    it("incluye hora y minuto en la timezone local", () => {
      expect(formatEsArDateTime("2026-07-22T15:30:00.000Z")).toBe("22 jul, 12:30 p. m.");
    });
  });
});
