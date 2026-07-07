const LIGHT_FOREGROUND = "#f8fafc";
const DARK_FOREGROUND = "#0f172a";

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Picks the foreground (light or dark) with better WCAG contrast against an
 * arbitrary background hex color, e.g. a per-business accent color that can't
 * be assumed dark enough for hardcoded white text.
 */
export function getAccentForeground(accentHex: string): string {
  const rgb = hexToRgb(accentHex);

  if (!rgb) {
    return LIGHT_FOREGROUND;
  }

  const luminance = relativeLuminance(rgb);
  // Prefer white as long as it clears the WCAG 3:1 minimum for large/bold UI
  // text (these are semibold button labels): contrast(white, L) = 1.05/(L+0.05)
  // >= 3 solves to L <= 0.30. Only below that bar - genuinely light accents like
  // yellow or lime - do we fall back to dark text. A stricter equal-contrast
  // crossover (~0.179) is "more optimal" in raw ratio terms, but it also flips
  // several real default template accents (e.g. #B86C8B) from the white text
  // they already render with today to black, for no reported problem there.
  return luminance > 0.3 ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}
