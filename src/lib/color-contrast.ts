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

/** WCAG contrast ratio between two hex colors. Returns 1 if either is invalid. */
export function contrastRatio(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);

  if (!rgbA || !rgbB) return 1;

  const [lighter, darker] = [relativeLuminance(rgbA), relativeLuminance(rgbB)].sort(
    (x, y) => y - x
  );

  return (lighter + 0.05) / (darker + 0.05);
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * El acento lo elige cada dueño de negocio, así que no se puede asumir que sea
 * legible como *texto* sobre el fondo claro de su página: el marrón del demo de
 * barbería (#8f6a3a) daba 4.35:1 sobre el crema, por debajo del 4.5:1 que pide
 * WCAG AA para texto normal.
 *
 * Devuelve el acento oscurecido lo mínimo necesario para llegar al objetivo,
 * conservando el tono (escala los canales hacia el negro). Si ya cumple, lo
 * devuelve intacto. Para fondos/acentos inválidos devuelve el acento sin tocar:
 * degradar el color nunca debe romper el render.
 *
 * Ojo: esto es para acento-como-texto. Para elegir el texto que va ENCIMA de un
 * bloque del color de acento, va getAccentForeground.
 */
export function getReadableAccentText(
  accentHex: string,
  backgroundHex: string,
  targetRatio = 4.5
): string {
  const accent = hexToRgb(accentHex);
  const background = hexToRgb(backgroundHex);

  if (!accent || !background) return accentHex;
  if (contrastRatio(accentHex, backgroundHex) >= targetRatio) return accentHex;

  // Búsqueda binaria del factor de oscurecimiento más chico que alcanza el
  // objetivo. 24 iteraciones dan precisión de sobra para 8 bits por canal.
  let low = 0;
  let high = 1;

  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    const candidate = toHex([accent[0] * mid, accent[1] * mid, accent[2] * mid]);

    if (contrastRatio(candidate, backgroundHex) >= targetRatio) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const result = toHex([accent[0] * low, accent[1] * low, accent[2] * low]);

  // El redondeo a enteros puede dejarlo un pelo por debajo; en ese caso, negro.
  return contrastRatio(result, backgroundHex) >= targetRatio ? result : "#000000";
}
