import { describe, expect, it } from "vitest";

import { getPublicBusinessThemeStyle, publicBusinessThemeStyleToCssText } from "./public-business-theme";

describe("getPublicBusinessThemeStyle", () => {
  it("maps light brand colors onto semantic tokens", () => {
    const style = getPublicBusinessThemeStyle(
      {
        accent: "#8F6A3A",
        accentSoft: "#E8DCCB",
        surfaceTint: "#F7F1E8",
      },
      "light"
    );

    expect(style["--background"]).toBe("#F7F1E8");
    expect(style["--primary"]).toBe("#8F6A3A");
    expect(style["--ring"]).toBe("#8F6A3A");
    expect(style["--surface-tint"]).toBe("#F7F1E8");
    expect(style["--business-accent"]).toBe("#8F6A3A");
    expect(style["--card"]).toBe("#ffffff");
  });

  it("maps dark mode colors when provided", () => {
    const style = getPublicBusinessThemeStyle(
      {
        accent: "#D4A574",
        accentSoft: "#27272a",
        surfaceTint: "#18181b",
        background: "#111111",
        foreground: "#fafafa",
        card: "#1a1a1a",
        cardForeground: "#fafafa",
      },
      "dark"
    );

    expect(style["--background"]).toBe("#111111");
    expect(style["--primary"]).toBe("#D4A574");
    expect(style["--card"]).toBe("#1a1a1a");
    expect(style["--business-accent"]).toBe("#D4A574");
  });

  it("serializes vars for SSR style tags", () => {
    const css = publicBusinessThemeStyleToCssText({
      "--background": "#F7F1E8",
      "--primary": "#8F6A3A",
    });

    expect(css).toContain("--background: #F7F1E8;");
    expect(css).toContain("--primary: #8F6A3A;");
  });
});
