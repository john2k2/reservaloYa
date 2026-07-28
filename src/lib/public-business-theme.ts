import type { DarkModeColors } from "@/constants/public-business-profiles";
import { getAccentForeground } from "@/lib/color-contrast";

export type PublicBusinessLightColors = {
  accent: string;
  accentSoft: string;
  surfaceTint: string;
};

/** CSS custom properties for a public business page (scoped to the theme root). */
export function getPublicBusinessThemeStyle(
  colors: PublicBusinessLightColors | DarkModeColors,
  mode: "light" | "dark"
): Record<string, string> {
  if (mode === "dark" && "background" in colors && "foreground" in colors) {
    const dark = colors as DarkModeColors;
    const accentFg = getAccentForeground(dark.accent);

    return {
      "--background": dark.background,
      "--foreground": dark.foreground,
      "--card": dark.card,
      "--card-foreground": dark.cardForeground,
      "--popover": dark.card,
      "--popover-foreground": dark.cardForeground,
      "--primary": dark.accent,
      "--primary-foreground": accentFg,
      "--secondary": dark.accentSoft,
      "--secondary-foreground": dark.foreground,
      "--muted": dark.accentSoft,
      "--muted-foreground": "#a1a1aa",
      "--accent": dark.accentSoft,
      "--accent-foreground": dark.foreground,
      "--ring": dark.accent,
      "--border": "#3f3f46",
      "--input": "#3f3f46",
      "--surface-tint": dark.surfaceTint,
      "--business-accent": dark.accent,
      "--business-accent-soft": dark.accentSoft,
    };
  }

  const light = colors as PublicBusinessLightColors;
  const accentFg = getAccentForeground(light.accent);

  return {
    "--background": light.surfaceTint,
    "--foreground": "#0f172a",
    "--card": "#ffffff",
    "--card-foreground": "#0f172a",
    "--popover": "#ffffff",
    "--popover-foreground": "#0f172a",
    "--primary": light.accent,
    "--primary-foreground": accentFg,
    "--secondary": light.accentSoft,
    "--secondary-foreground": "#0f172a",
    "--muted": light.accentSoft,
    // slate-600, no slate-500 (#64748b): sobre los fondos claros que usan los negocios
    // (#F6F1EA, #FCF6F7, ...) slate-500 daba 4.24:1 y no llegaba al 4.5:1 que pide
    // WCAG AA para texto normal. slate-600 da 6.74:1 en el peor de esos fondos.
    "--muted-foreground": "#475569",
    "--accent": light.accentSoft,
    "--accent-foreground": "#0f172a",
    "--ring": light.accent,
    "--border": "#e2e8f0",
    "--input": "#e2e8f0",
    "--surface-tint": light.surfaceTint,
    "--business-accent": light.accent,
    "--business-accent-soft": light.accentSoft,
  };
}

export function publicBusinessThemeStyleToCssText(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
}
