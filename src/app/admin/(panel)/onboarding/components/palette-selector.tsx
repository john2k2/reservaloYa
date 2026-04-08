"use client";

import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandingPalette } from "@/constants/branding-palettes";

interface PaletteSelectorProps {
  palettes: BrandingPalette[];
  selectedId: string;
  onSelect: (paletteId: string) => void;
}

export function PaletteSelector({
  palettes,
  selectedId,
  onSelect,
}: PaletteSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {palettes.map((palette) => {
        const isSelected = palette.id === selectedId;

        return (
          <button
            key={palette.id}
            type="button"
            onClick={() => onSelect(palette.id)}
            className={cn(
              "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
              "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
              isSelected
                ? "border-foreground bg-foreground/5"
                : "border-border bg-card hover:border-foreground/30"
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 size-5 rounded-full bg-foreground text-background flex items-center justify-center">
                <Check className="size-3" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: palette.accent }} />
              <div className="size-8 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: palette.accentSoft }} />
              <div className="size-8 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: palette.surfaceTint }} />
            </div>

            <h4 className="font-medium text-sm text-foreground mb-1">{palette.label}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{palette.description}</p>

            <div className="mt-3 pt-3 border-t border-border/50">
              <div
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: palette.accent, color: "#ffffff" }}
              >
                Botón ejemplo
              </div>
            </div>
          </button>
        );
      })}

      {/* Opción personalizada */}
      <button
        type="button"
        onClick={() => onSelect("custom")}
        className={cn(
          "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
          "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
          selectedId === "custom"
            ? "border-foreground bg-foreground/5"
            : "border-border bg-card hover:border-foreground/30"
        )}
      >
        {selectedId === "custom" && (
          <div className="absolute top-3 right-3 size-5 rounded-full bg-foreground text-background flex items-center justify-center">
            <Check className="size-3" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-lg border border-dashed border-border flex items-center justify-center bg-background">
            <Palette className="size-4 text-muted-foreground" />
          </div>
        </div>

        <h4 className="font-medium text-sm text-foreground mb-1">Personalizado</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">Elegí tus propios colores con el selector.</p>
      </button>
    </div>
  );
}
