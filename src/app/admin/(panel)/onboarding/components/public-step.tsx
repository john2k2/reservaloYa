import type { Dispatch, SetStateAction } from "react";

import { Globe } from "lucide-react";

import { FormField } from "./form-field";
import { OnboardingStepActions } from "./onboarding-step-actions";

type Step4Data = {
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  mapQuery: string;
};

type PublicStepProps = {
  step4Data: Step4Data;
  setStep4Data: Dispatch<SetStateAction<Step4Data>>;
  hasExistingBusiness: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function PublicStep({
  step4Data,
  setStep4Data,
  hasExistingBusiness,
  isSubmitting,
  onBack,
  onSubmit,
}: PublicStepProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Globe aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Paso 4: Datos publicos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega tus redes sociales y la direccion para el mapa.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="instagram"
            label="Instagram"
            placeholder="@tu.marca"
            value={step4Data.instagram}
            onChange={(value) => setStep4Data((d) => ({ ...d, instagram: value }))}
            hint="Sin @, solo el nombre de usuario"
          />

          <FormField
            id="facebook"
            label="Facebook"
            placeholder="tu.pagina"
            value={step4Data.facebook}
            onChange={(value) => setStep4Data((d) => ({ ...d, facebook: value }))}
            hint="Usuario o nombre de pagina"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="tiktok"
            label="TikTok"
            placeholder="@tu.marca"
            value={step4Data.tiktok}
            onChange={(value) => setStep4Data((d) => ({ ...d, tiktok: value }))}
            hint="Con o sin @"
          />

          <FormField
            id="website"
            label="Website (opcional)"
            type="url"
            placeholder="https://..."
            value={step4Data.website}
            onChange={(value) => setStep4Data((d) => ({ ...d, website: value }))}
            hint="Si tenes otro sitio web"
          />
        </div>

        <FormField
          id="mapQuery"
          label="Direccion para el mapa"
          placeholder="Ej: Honduras 4821, Palermo, Buenos Aires"
          value={step4Data.mapQuery}
          onChange={(value) => setStep4Data((d) => ({ ...d, mapQuery: value }))}
          hint="Esta direccion se usa para mostrar el mapa en tu pagina"
        />
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
        <div className="mb-6 rounded-2xl bg-secondary/30 p-5">
          <h4 className="mb-2 font-medium text-foreground">Que sigue?</h4>
          <p className="text-sm text-muted-foreground">
            Al guardar, tu pagina quedara lista con todos los cambios. Podes seguir editando despues
            desde el panel de configuracion.
          </p>
        </div>

        <OnboardingStepActions
          onBack={onBack}
          onPrimary={onSubmit}
          primaryLabel={isSubmitting ? "Guardando..." : hasExistingBusiness ? "Guardar todo" : "Guardar y publicar"}
          isSubmitting={isSubmitting}
          showSaveIcon={true}
        />
      </div>
    </article>
  );
}
