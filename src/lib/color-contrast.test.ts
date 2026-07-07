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

  it("picks dark foreground for a mid-tone background below the naive 0.5 shortcut", () => {
    // #999999 has relative luminance ~0.319 - above the real WCAG crossover
    // (~0.179) where black text has more contrast, but below a naive 0.5
    // threshold that would incorrectly pick light text here.
    expect(getAccentForeground("#999999")).toBe("#0f172a");
  });
});
