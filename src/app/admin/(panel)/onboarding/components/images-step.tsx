import type { Dispatch, SetStateAction } from "react";

import { ImagePlus } from "lucide-react";

import { ImageUpload } from "./image-upload";
import { OnboardingStepActions } from "./onboarding-step-actions";

type GalleryImageInput = {
  file: File | null;
  alt: string;
  cleared: boolean;
};

type Step3Data = {
  logo: File | null;
  hero: File | null;
  logoCleared: boolean;
  heroCleared: boolean;
  gallery: GalleryImageInput[];
};

type ImagesStepProps = {
  step3Data: Step3Data;
  setStep3Data: Dispatch<SetStateAction<Step3Data>>;
  galleryImageHints: string[];
  settingsData: {
    profile: {
      logoUrl?: string | null;
      heroImageUrl?: string | null;
      gallery?: { url: string; alt: string }[] | null;
    };
  };
  hasExistingBusiness: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveAll: () => void;
};

export function ImagesStep({
  step3Data,
  setStep3Data,
  galleryImageHints,
  settingsData,
  hasExistingBusiness,
  isSubmitting,
  onBack,
  onNext,
  onSaveAll,
}: ImagesStepProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <ImagePlus aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Paso 3: Fotos del negocio</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Subí imágenes para personalizar tu página. Si no subís nada, usamos imágenes demo.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUpload
            id="logoFile"
            label="Logo del negocio"
            hint="Cuadrado o rectangular, se mostrara en el header"
            preview={
              step3Data.logo
                ? URL.createObjectURL(step3Data.logo)
                : step3Data.logoCleared
                  ? null
                  : settingsData.profile.logoUrl
            }
            onChange={(file) => setStep3Data((d) => ({ ...d, logo: file, logoCleared: false }))}
            onClear={() => setStep3Data((d) => ({ ...d, logo: null, logoCleared: true }))}
          />

          <ImageUpload
            id="heroFile"
            label="Foto de portada"
            hint="Foto horizontal del local o experiencia"
            preview={
              step3Data.hero
                ? URL.createObjectURL(step3Data.hero)
                : step3Data.heroCleared
                  ? null
                  : settingsData.profile.heroImageUrl
            }
            onChange={(file) => setStep3Data((d) => ({ ...d, hero: file, heroCleared: false }))}
            onClear={() => setStep3Data((d) => ({ ...d, hero: null, heroCleared: true }))}
          />
        </div>

        <div>
          <h4 className="mb-4 text-sm font-medium text-foreground">Galería (opcional)</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {galleryImageHints.map((hint, index) => (
              <ImageUpload
                key={index}
                id={`galleryFile${index + 1}`}
                label={`Foto ${index + 1}`}
                hint={hint}
                preview={
                  step3Data.gallery[index]?.file
                    ? URL.createObjectURL(step3Data.gallery[index].file!)
                    : step3Data.gallery[index]?.cleared
                      ? null
                      : settingsData.profile.gallery?.[index]?.url
                }
                descriptionValue={step3Data.gallery[index]?.alt ?? ""}
                descriptionPlaceholder={`Ej: ${hint}`}
                onDescriptionChange={(value) =>
                  setStep3Data((d) => ({
                    ...d,
                    gallery: d.gallery.map((item, i) => (i === index ? { ...item, alt: value } : item)),
                  }))
                }
                onChange={(file) =>
                  setStep3Data((d) => ({
                    ...d,
                    gallery: d.gallery.map((item, i) => (i === index ? { ...item, file, cleared: false } : item)),
                  }))
                }
                onClear={() =>
                  setStep3Data((d) => ({
                    ...d,
                    gallery: d.gallery.map((item, i) =>
                      i === index ? { ...item, file: null, cleared: true } : item
                    ),
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <OnboardingStepActions
          onBack={onBack}
          onPrimary={hasExistingBusiness ? onSaveAll : onNext}
          primaryLabel={isSubmitting ? "Guardando..." : hasExistingBusiness ? "Guardar todo" : "Continuar"}
          isSubmitting={isSubmitting}
          showSaveIcon={hasExistingBusiness}
        />
      </div>
    </article>
  );
}
