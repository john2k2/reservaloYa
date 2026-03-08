export type BrandingPalette = {
  id: string;
  label: string;
  description: string;
  accent: string;
  accentSoft: string;
  surfaceTint: string;
};

export const brandingPalettes: BrandingPalette[] = [
  {
    id: "warm-premium",
    label: "Calido premium",
    description: "Tonos tierra y cercania visual para barberia, wellness o servicios premium.",
    accent: "#8F6A3A",
    accentSoft: "#E8DCCB",
    surfaceTint: "#F6F1EA",
  },
  {
    id: "soft-editorial",
    label: "Suave editorial",
    description: "Paleta delicada y limpia para estetica, skincare o beauty studio.",
    accent: "#A55D6F",
    accentSoft: "#F1D8DF",
    surfaceTint: "#FCF6F7",
  },
  {
    id: "minimal-neutral",
    label: "Minimal neutro",
    description: "Look sobrio y versatil para marcas que quieren algo simple y elegante.",
    accent: "#1F2937",
    accentSoft: "#E5E7EB",
    surfaceTint: "#F9FAFB",
  },
];

export function getBrandingPalette(paletteId?: string | null) {
  return (
    brandingPalettes.find((palette) => palette.id === paletteId) ?? brandingPalettes[0]
  );
}

export function getPaletteIdFromColors(input: {
  accent?: string;
  accentSoft?: string;
  surfaceTint?: string;
}) {
  return (
    brandingPalettes.find(
      (palette) =>
        palette.accent.toLowerCase() === input.accent?.toLowerCase() &&
        palette.accentSoft.toLowerCase() === input.accentSoft?.toLowerCase() &&
        palette.surfaceTint.toLowerCase() === input.surfaceTint?.toLowerCase()
    )?.id ?? "custom"
  );
}
