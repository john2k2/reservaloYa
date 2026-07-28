import { describe, expect, it } from "vitest";

import { contrastRatio, getAccentForeground, getReadableAccentText } from "./color-contrast";

describe("getAccentForeground", () => {
  it("returns a dark foreground for a light accent", () => {
    expect(getAccentForeground("#FDE047")).toBe("#0f172a");
  });

  it("returns a light foreground for a dark accent", () => {
    expect(getAccentForeground("#111827")).toBe("#f8fafc");
  });

  it("supports 3-digit hex shorthand", () => {
    expect(getAccentForeground("#fff")).toBe("#0f172a");
    expect(getAccentForeground("#000")).toBe("#f8fafc");
  });

  it("falls back to the light foreground for an invalid hex", () => {
    expect(getAccentForeground("not-a-color")).toBe("#f8fafc");
  });

  it("picks dark foreground once white text would drop below the 3:1 contrast floor", () => {
    // #999999 has relative luminance ~0.319, just past the 0.30 cutoff where
    // white text's contrast ratio falls under 3:1 - the WCAG minimum for
    // large/bold UI text this function targets.
    expect(getAccentForeground("#999999")).toBe("#0f172a");
  });
});

describe("contrastRatio", () => {
  it("returns the maximum ratio for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#8f6a3a", "#8f6a3a")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#475569", "#f6f1ea")).toBeCloseTo(
      contrastRatio("#f6f1ea", "#475569"),
      5
    );
  });
});

describe("getReadableAccentText", () => {
  it("leaves an accent that already meets AA untouched", () => {
    // #475569 sobre #f6f1ea ya da 6.74:1
    expect(getReadableAccentText("#475569", "#f6f1ea")).toBe("#475569");
  });

  it("darkens an accent that falls just short of AA", () => {
    // El marrón del demo de barbería: 4.35:1 sobre el fondo crema
    const result = getReadableAccentText("#8f6a3a", "#f6f1ea");
    expect(result).not.toBe("#8f6a3a");
    expect(contrastRatio(result, "#f6f1ea")).toBeGreaterThanOrEqual(4.5);
  });

  it("darkens against the darker surface tint too", () => {
    const result = getReadableAccentText("#8f6a3a", "#e8dccb");
    expect(contrastRatio(result, "#e8dccb")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the result a valid 6-digit hex", () => {
    expect(getReadableAccentText("#8f6a3a", "#f6f1ea")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns the accent unchanged when either color is invalid", () => {
    expect(getReadableAccentText("not-a-color", "#f6f1ea")).toBe("not-a-color");
    expect(getReadableAccentText("#8f6a3a", "nope")).toBe("#8f6a3a");
  });

  it("handles accents that can never reach the target without going black", () => {
    // Amarillo sobre blanco: hay que oscurecerlo mucho, pero tiene que cumplir igual
    const result = getReadableAccentText("#ffe600", "#ffffff");
    expect(contrastRatio(result, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
