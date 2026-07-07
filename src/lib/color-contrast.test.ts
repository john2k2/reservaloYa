import { describe, expect, it } from "vitest";

import { getAccentForeground } from "./color-contrast";

describe("getAccentForeground", () => {
  it("returns a dark foreground for a light accent", () => {
    expect(getAccentForeground("#FDE047")).toBe("#0f172a");
  });

  it("returns a light foreground for a dark accent", () => {
    expect(getAccentForeground("#0D9488")).toBe("#f8fafc");
  });

  it("supports 3-digit hex shorthand", () => {
    expect(getAccentForeground("#fff")).toBe("#0f172a");
    expect(getAccentForeground("#000")).toBe("#f8fafc");
  });

  it("falls back to the light foreground for an invalid hex", () => {
    expect(getAccentForeground("not-a-color")).toBe("#f8fafc");
  });
});
