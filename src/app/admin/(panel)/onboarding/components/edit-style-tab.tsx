import type { Dispatch, SetStateAction } from "react";

import { Palette } from "lucide-react";

import { brandingPalettes } from "@/constants/branding-palettes";
import { ColorPicker } from "@/components/admin/color-picker";

import { FormField } from "./form-field";
import { PaletteSelector } from "./palette-selector";

type ValidationFn = (value: string) => string | null;

type StyleData = {
  palette: string;
  customAccent: string;
  customAccentSoft: string;
  customSurfaceTint: string;
  badge: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  enableDarkMode: boolean;
  darkModeColors: {
    accent: string;
    accentSoft: string;
    surfaceTint: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
  };
};

type EditStyleTabProps = {
  styleData: StyleData;
  setStyleData: Dispatch<SetStateAction<StyleData>>;
  validations: {
    badge: ValidationFn;
    eyebrow: ValidationFn;
    headline: ValidationFn;
    description: ValidationFn;
    cta: ValidationFn;
  };
};

export function EditStyleTab({
  styleData,
  setStyleData,
  validations,
}: EditStyleTabProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Palette aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Estilo visual</h3>
          <p className="mt-1 text-sm text-muted-foreground">Colores y textos de tu página.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h4 className="mb-4 text-sm font-medium text-foreground">Paleta de colores</h4>
          <PaletteSelector
            palettes={brandingPalettes}
            selectedId={styleData.palette}
            onSelect={(id) => setStyleData((d) => ({ ...d, palette: id }))}
          />

          {styleData.palette === "custom" && (
            <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Colores personalizados</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <ColorPicker
                  label="Principal"
                  value={styleData.customAccent}
                  onChange={(value) => setStyleData((d) => ({ ...d, customAccent: value }))}
                />
                <ColorPicker
                  label="Suave"
                  value={styleData.customAccentSoft}
                  onChange={(value) => setStyleData((d) => ({ ...d, customAccentSoft: value }))}
                />
                <ColorPicker
                  label="Fondo"
                  value={styleData.customSurfaceTint}
                  onChange={(value) => setStyleData((d) => ({ ...d, customSurfaceTint: value }))}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-background p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-foreground">Modo oscuro</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Permitir a los visitantes cambiar entre modo claro y oscuro
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={styleData.enableDarkMode}
                onChange={(e) => setStyleData((d) => ({ ...d, enableDarkMode: e.target.checked }))}
                className="peer sr-only"
              />
              <div className="relative h-7 w-12 rounded-full border-2 border-border bg-secondary transition-all peer-checked:border-foreground peer-checked:bg-foreground">
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          {styleData.enableDarkMode && (
            <div className="mt-5 space-y-4 border-t border-border/40 pt-5">
              <p className="text-xs text-muted-foreground">Personaliza los colores para el modo oscuro</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ColorPicker
                  label="Principal"
                  value={styleData.darkModeColors.accent}
                  onChange={(value) =>
                    setStyleData((d) => ({ ...d, darkModeColors: { ...d.darkModeColors, accent: value } }))
                  }
                />
                <ColorPicker
                  label="Fondo"
                  value={styleData.darkModeColors.background}
                  onChange={(value) =>
                    setStyleData((d) => ({ ...d, darkModeColors: { ...d.darkModeColors, background: value } }))
                  }
                />
                <ColorPicker
                  label="Texto"
                  value={styleData.darkModeColors.foreground}
                  onChange={(value) =>
                    setStyleData((d) => ({ ...d, darkModeColors: { ...d.darkModeColors, foreground: value } }))
                  }
                />
                <ColorPicker
                  label="Tarjetas"
                  value={styleData.darkModeColors.card}
                  onChange={(value) =>
                    setStyleData((d) => ({ ...d, darkModeColors: { ...d.darkModeColors, card: value } }))
                  }
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h4 className="text-sm font-medium text-foreground">Textos de la página</h4>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="badge"
              label="Franja superior"
              placeholder="Ej: Estetica y skincare"
              required
              value={styleData.badge}
              onChange={(value) => setStyleData((d) => ({ ...d, badge: value }))}
              validate={validations.badge}
              maxLength={80}
              hint="Aparece como etiqueta arriba del título"
            />

            <FormField
              id="eyebrow"
              label="Bajada corta"
              placeholder="Ej: Turnos online sin mensajes cruzados"
              required
              value={styleData.eyebrow}
              onChange={(value) => setStyleData((d) => ({ ...d, eyebrow: value }))}
              validate={validations.eyebrow}
              maxLength={120}
              hint="Subtítulo debajo de la franja"
            />
          </div>

          <FormField
            id="headline"
            label="Titulo principal"
            required
            value={styleData.headline}
            onChange={(value) => setStyleData((d) => ({ ...d, headline: value }))}
            validate={validations.headline}
            maxLength={160}
            hint="El título más importante de tu página"
          />

          <FormField
            id="description"
            label="Descripcion"
            type="textarea"
            required
            value={styleData.description}
            onChange={(value) => setStyleData((d) => ({ ...d, description: value }))}
            validate={validations.description}
            maxLength={320}
            hint="Una breve descripcion de tu negocio"
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="primaryCta"
              label="Boton principal"
              placeholder="Ej: Reservar turno"
              required
              value={styleData.primaryCta}
              onChange={(value) => setStyleData((d) => ({ ...d, primaryCta: value }))}
              validate={validations.cta}
              maxLength={40}
              hint="Texto del boton principal"
            />

            <FormField
              id="secondaryCta"
              label="Boton secundario"
              placeholder="Ej: Ver servicios"
              required
              value={styleData.secondaryCta}
              onChange={(value) => setStyleData((d) => ({ ...d, secondaryCta: value }))}
              validate={validations.cta}
              maxLength={40}
              hint="Texto del boton secundario"
            />
          </div>
        </section>
      </div>
    </article>
  );
}
