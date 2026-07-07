import { describe, expect, it } from "vitest";

import { getAccentForeground } from "./color-contrast";

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
