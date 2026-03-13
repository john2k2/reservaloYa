import type { Dispatch, SetStateAction } from "react";

import { Palette } from "lucide-react";

import { brandingPalettes } from "@/constants/branding-palettes";

import { FormField } from "./form-field";
import { OnboardingStepActions } from "./onboarding-step-actions";
import { PaletteSelector } from "./palette-selector";

type Step2Data = {
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
};

type ValidationFn = (value: string) => string | null;

type BrandingStepProps = {
  step2Data: Step2Data;
  setStep2Data: Dispatch<SetStateAction<Step2Data>>;
  validations: {
    badge: ValidationFn;
    eyebrow: ValidationFn;
    headline: ValidationFn;
    description: ValidationFn;
    cta: ValidationFn;
  };
  hasExistingBusiness: boolean;
  isSubmitting: boolean;
  isStepValid: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveAll: () => void;
};

export function BrandingStep({
  step2Data,
  setStep2Data,
  validations,
  hasExistingBusiness,
  isSubmitting,
  isStepValid,
  onBack,
  onNext,
  onSaveAll,
}: BrandingStepProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Palette aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Paso 2: Estilo visual</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí una paleta de colores y personaliza los textos de tu página.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h4 className="mb-4 text-sm font-medium text-foreground">Paleta de colores</h4>
          <PaletteSelector
            palettes={brandingPalettes}
            selectedId={step2Data.palette}
            onSelect={(id) => setStep2Data((d) => ({ ...d, palette: id }))}
          />

          {step2Data.palette === "custom" && (
            <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Colores personalizados</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Principal</span>
                  <input
                    type="color"
                    value={step2Data.customAccent}
                    onChange={(e) => setStep2Data((d) => ({ ...d, customAccent: e.target.value }))}
                    className="h-11 w-full rounded-md border border-border/70 bg-background p-1"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Suave</span>
                  <input
                    type="color"
                    value={step2Data.customAccentSoft}
                    onChange={(e) => setStep2Data((d) => ({ ...d, customAccentSoft: e.target.value }))}
                    className="h-11 w-full rounded-md border border-border/70 bg-background p-1"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Fondo</span>
                  <input
                    type="color"
                    value={step2Data.customSurfaceTint}
                    onChange={(e) => setStep2Data((d) => ({ ...d, customSurfaceTint: e.target.value }))}
                    className="h-11 w-full rounded-md border border-border/70 bg-background p-1"
                  />
                </label>
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
              value={step2Data.badge}
              onChange={(value) => setStep2Data((d) => ({ ...d, badge: value }))}
              validate={validations.badge}
              maxLength={80}
              hint="Aparece como etiqueta arriba del título"
            />

            <FormField
              id="eyebrow"
              label="Bajada corta"
              placeholder="Ej: Turnos online sin mensajes cruzados"
              required
              value={step2Data.eyebrow}
              onChange={(value) => setStep2Data((d) => ({ ...d, eyebrow: value }))}
              validate={validations.eyebrow}
              maxLength={120}
              hint="Subtítulo debajo de la franja"
            />
          </div>

          <FormField
            id="headline"
            label="Titulo principal"
            required
            value={step2Data.headline}
            onChange={(value) => setStep2Data((d) => ({ ...d, headline: value }))}
            validate={validations.headline}
            maxLength={160}
            hint="El título más importante de tu página"
          />

          <FormField
            id="description"
            label="Descripcion"
            type="textarea"
            required
            value={step2Data.description}
            onChange={(value) => setStep2Data((d) => ({ ...d, description: value }))}
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
              value={step2Data.primaryCta}
              onChange={(value) => setStep2Data((d) => ({ ...d, primaryCta: value }))}
              validate={validations.cta}
              maxLength={40}
              hint="Texto del boton principal"
            />

            <FormField
              id="secondaryCta"
              label="Boton secundario"
              placeholder="Ej: Ver servicios"
              required
              value={step2Data.secondaryCta}
              onChange={(value) => setStep2Data((d) => ({ ...d, secondaryCta: value }))}
              validate={validations.cta}
              maxLength={40}
              hint="Texto del boton secundario"
            />
          </div>
        </section>
      </div>

      <div className="mt-8">
        <OnboardingStepActions
          onBack={onBack}
          onPrimary={hasExistingBusiness ? onSaveAll : onNext}
          primaryLabel={isSubmitting ? "Guardando..." : hasExistingBusiness ? "Guardar todo" : "Continuar"}
          primaryDisabled={!hasExistingBusiness && !isStepValid}
          isSubmitting={isSubmitting}
          showSaveIcon={hasExistingBusiness}
        />
      </div>
    </article>
  );
}
