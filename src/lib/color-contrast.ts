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
  // Contrast ratio against white is (1.05) / (luminance + 0.05); against black
  // it's (luminance + 0.05) / 0.05. Setting those equal and solving for luminance
  // gives the exact crossover: ~0.179. Above it, black text has more contrast;
  // below it, white does. (0.5 is a common shorthand but is measurably wrong for
  // backgrounds in the ~0.18-0.5 range, where black is actually the better pick.)
  return luminance > 0.179 ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}
