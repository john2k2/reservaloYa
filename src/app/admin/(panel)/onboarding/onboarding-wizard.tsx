"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { getPaletteIdFromColors } from "@/constants/branding-palettes";
import {
  activateLocalBusinessAction,
  createOnboardedBusinessAction,
  saveOnboardingBrandingAction,
} from "./actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { BrandingStep } from "./components/branding-step";
import { BusinessStep } from "./components/business-step";
import { OnboardingStepper, type OnboardingStep } from "./components/onboarding-stepper";
import { ImagesStep } from "./components/images-step";
import { OnboardingStatusBanner } from "./components/onboarding-status-banner";
import { PublicStep } from "./components/public-step";
import { onboardingValidations as validations } from "./onboarding-validations";

type GalleryImageInput = {
  file: File | null;
  alt: string;
  cleared: boolean;
};

const galleryImageHints = [
  "Frente del local",
  "Espacio de trabajo",
  "Detalle del servicio",
];

type Step1FormValues = {
  templateSlug: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
};

type Step2FormValues = {
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

type Step3FormValues = {
  logo: File | null;
  hero: File | null;
  logoCleared: boolean;
  heroCleared: boolean;
  gallery: GalleryImageInput[];
};

type Step4FormValues = {
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  mapQuery: string;
};

// Arma el FormData del paso 1 (datos del negocio) para el alta inicial.
function buildStep1FormData(params: { step1Data: Step1FormValues }): FormData {
  const { step1Data } = params;
  const formData = new FormData();

  formData.append("templateSlug", step1Data.templateSlug);
  formData.append("name", step1Data.name);
  formData.append("slug", step1Data.slug);
  formData.append("phone", step1Data.phone);
  formData.append("email", step1Data.email);
  formData.append("address", step1Data.address);

  return formData;
}

// Arma el FormData de branding (pasos 2 a 4: colores, textos, imágenes y redes).
function buildBrandingFormData(params: {
  activeBusinessSlug: string;
  step2Data: Step2FormValues;
  step3Data: Step3FormValues;
  step4Data: Step4FormValues;
}): FormData {
  const { activeBusinessSlug, step2Data, step3Data, step4Data } = params;
  const formData = new FormData();

  formData.append("businessSlug", activeBusinessSlug);
  formData.append("palette", step2Data.palette);
  formData.append("customAccent", step2Data.customAccent);
  formData.append("customAccentSoft", step2Data.customAccentSoft);
  formData.append("customSurfaceTint", step2Data.customSurfaceTint);
  formData.append("badge", step2Data.badge);
  formData.append("eyebrow", step2Data.eyebrow);
  formData.append("headline", step2Data.headline);
  formData.append("description", step2Data.description);
  formData.append("primaryCta", step2Data.primaryCta);
  formData.append("secondaryCta", step2Data.secondaryCta);
  formData.append("instagram", step4Data.instagram);
  formData.append("facebook", step4Data.facebook);
  formData.append("tiktok", step4Data.tiktok);
  formData.append("website", step4Data.website);
  formData.append("mapQuery", step4Data.mapQuery);

  if (step3Data.logo) formData.append("logoFile", step3Data.logo);
  if (step3Data.hero) formData.append("heroFile", step3Data.hero);
  formData.append("clearLogoFile", String(step3Data.logoCleared));
  formData.append("clearHeroFile", String(step3Data.heroCleared));
  step3Data.gallery.forEach((item, i) => {
    if (item.file) formData.append(`galleryFile${i + 1}`, item.file);
    formData.append(`galleryAlt${i + 1}`, item.alt.trim());
    formData.append(`clearGalleryFile${i + 1}`, String(item.cleared));
  });

  return formData;
}

interface OnboardingWizardProps {
  onboardingData: {
    demoMode: boolean;
    templates: { slug: string; label: string; category: string }[];
    businesses: { slug: string; name: string; phone: string }[];
    activeBusinessSlug: string | null;
  };
  settingsData: {
    businessName: string;
    businessSlug: string;
    email: string;
    address: string;
    cancellationPolicy?: string;
    autoConfirmBookings?: boolean;
    publicUrl: string;
    mpConnected?: boolean;
    mpCollectorId?: string;
    mpOAuthUrl?: string | null;
    whatsappConfigured?: boolean;
    defaultTab?: "business" | "style" | "images" | "public" | "integrations";
    profile: {
      accent: string;
      accentSoft: string;
      surfaceTint: string;
      badge: string;
      eyebrow: string;
      headline: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      website?: string;
      mapQuery?: string;
      gallery?: { url: string; alt: string }[] | null;
      logoUrl?: string | null;
      heroImageUrl?: string | null;
      enableDarkMode?: boolean;
      darkModeColors?: {
        accent: string;
        accentSoft: string;
        surfaceTint: string;
        background: string;
        foreground: string;
        card: string;
        cardForeground: string;
      };
    };
  };
  searchParams: {
    error?: string;
    created?: string;
    brandingSaved?: string;
    businessUpdated?: string;
    tab?: string;
    mp?: string;
  };
}

export default function OnboardingWizard({
  onboardingData,
  settingsData,
  searchParams,
}: OnboardingWizardProps) {
  const error = searchParams.error;
  const created = searchParams.created;
  const brandingSaved = searchParams.brandingSaved;
  const businessUpdated = searchParams.businessUpdated;

  const createdBusiness = onboardingData.businesses.find((b) => b.slug === created);
  const activeBusinessSlug = onboardingData.activeBusinessSlug ?? settingsData.businessSlug;

  // Estado del paso actual
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del formulario - Paso 1
  const [step1Data, setStep1Data] = useState({
    templateSlug: "demo-estetica",
    name: "",
    slug: "",
    phone: "",
    email: settingsData.email,
    address: settingsData.address ?? "",
  });

  // Estado del formulario - Paso 2
  const currentPaletteId = getPaletteIdFromColors({
    accent: settingsData.profile.accent,
    accentSoft: settingsData.profile.accentSoft,
    surfaceTint: settingsData.profile.surfaceTint,
  });

  const [step2Data, setStep2Data] = useState({
    palette: currentPaletteId,
    customAccent: settingsData.profile.accent,
    customAccentSoft: settingsData.profile.accentSoft,
    customSurfaceTint: settingsData.profile.surfaceTint,
    badge: settingsData.profile.badge,
    eyebrow: settingsData.profile.eyebrow,
    headline: settingsData.profile.headline,
    description: settingsData.profile.description,
    primaryCta: settingsData.profile.primaryCta,
    secondaryCta: settingsData.profile.secondaryCta,
  });

  // Estado del formulario - Paso 3
  const [step3Data, setStep3Data] = useState<{
    logo: File | null;
    hero: File | null;
    logoCleared: boolean;
    heroCleared: boolean;
    gallery: GalleryImageInput[];
  }>({
    logo: null,
    hero: null,
    logoCleared: false,
    heroCleared: false,
    gallery: galleryImageHints.map((_, index) => ({
      file: null,
      alt: settingsData.profile.gallery?.[index]?.alt ?? "",
      cleared: false,
    })),
  });

  // Estado del formulario - Paso 4
  const [step4Data, setStep4Data] = useState({
    instagram: settingsData.profile.instagram ?? "",
    facebook: settingsData.profile.facebook ?? "",
    tiktok: settingsData.profile.tiktok ?? "",
    website: settingsData.profile.website ?? "",
    mapQuery: settingsData.profile.mapQuery ?? settingsData.address,
  });

  // Actualizar pasos completados cuando se crea un nuevo negocio
  useEffect(() => {
    if (created) {
      const completed = new Set<number>([0]);
      setCompletedSteps(completed);
      // Auto-avanzar al paso 2 cuando se acaba de crear un negocio
      if (currentStep === 0) {
        setCurrentStep(1);
      }
    }
  }, [created, currentStep]);

  // Definir los pasos
  const steps: OnboardingStep[] = [
    {
      id: "business",
      label: "Negocio",
      description: "Datos básicos",
      status: completedSteps.has(0) ? "completed" : currentStep === 0 ? "current" : "pending",
    },
    {
      id: "branding",
      label: "Estilo",
      description: "Colores y textos",
      status: completedSteps.has(1) ? "completed" : currentStep === 1 ? "current" : "pending",
    },
    {
      id: "images",
      label: "Fotos",
      description: "Galería e imágenes",
      status: completedSteps.has(2) ? "completed" : currentStep === 2 ? "current" : "pending",
    },
    {
      id: "public",
      label: "Público",
      description: "Redes y contacto",
      status: completedSteps.has(3) ? "completed" : currentStep === 3 ? "current" : "pending",
    },
  ];

  // Handlers de navegación
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= 3) {
      setCurrentStep(step);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Validación de paso actual
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          step1Data.name.length >= 3 &&
          step1Data.phone.length >= 6 &&
          step1Data.address.length >= 4 &&
          !validations.name(step1Data.name) &&
          !validations.phone(step1Data.phone) &&
          !validations.address(step1Data.address) &&
          (!step1Data.slug || !validations.slug(step1Data.slug)) &&
          (!step1Data.email || !validations.email(step1Data.email))
        );
      case 1:
        return (
          !validations.badge(step2Data.badge) &&
          !validations.eyebrow(step2Data.eyebrow) &&
          !validations.headline(step2Data.headline) &&
          !validations.description(step2Data.description) &&
          !validations.cta(step2Data.primaryCta) &&
          !validations.cta(step2Data.secondaryCta)
        );
      case 2:
        return true; // Las imágenes son opcionales
      case 3:
        return true; // Los datos públicos son opcionales
      default:
        return false;
    }
  }, [currentStep, step1Data, step2Data]);

  // Submit del paso 1 (alta del negocio)
  const handleStep1Submit = useCallback(async () => {
    if (!isStepValid()) return;

    setIsSubmitting(true);
    const formData = buildStep1FormData({ step1Data });
    try {
      await createOnboardedBusinessAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [step1Data, isStepValid]);

  // Submit del paso 2-4 (branding)
  const handleBrandingSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const formData = buildBrandingFormData({ activeBusinessSlug, step2Data, step3Data, step4Data });

    try {
      await saveOnboardingBrandingAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeBusinessSlug, step2Data, step3Data, step4Data]);

  return (
    <div className="flex min-h-full flex-col items-center space-y-8 pb-10 bg-background">
      {/* Header */}
      <section className="w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Onboarding guiado
              </div>
              <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                Configura tu página paso a paso
              </h2>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground">
                Completa los 4 pasos para dejar tu página pública lista. Puedes volver atrás y editar en cualquier momento.
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-8">
            <OnboardingStepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={goToStep}
              allowNavigation={true}
            />
          </div>
        </div>
      </section>

      {/* Mensajes de éxito/error */}
      {createdBusiness && (
        <OnboardingStatusBanner
          title={`¡Negocio "${createdBusiness.name}" creado!`}
          description="Continuá configurando el estilo visual y las fotos de tu página."
          href={`/${createdBusiness.slug}`}
          secondaryAction={
            <button onClick={goNext} className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11")}>
              Continuar
              <ChevronRight className="ml-1 size-4" />
            </button>
          }
        />
      )}

      {businessUpdated && (
        <OnboardingStatusBanner
          title={`¡Negocio "${businessUpdated}" actualizado!`}
          description="Los cambios ya están aplicados en tu página pública."
          href={`/${activeBusinessSlug}`}
        />
      )}

      {error && (
        <section className="w-full">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        </section>
      )}

      {brandingSaved && (
        <OnboardingStatusBanner
          title={brandingSaved}
          description="Los cambios ya están aplicados en tu página pública."
          href={`/${activeBusinessSlug}`}
        />
      )}

      <div className="w-full">
        {/* Formulario */}
        <div className="space-y-6">
          {/* PASO 1: Negocio */}
          {currentStep === 0 && (
            <BusinessStep
              step1Data={step1Data}
              setStep1Data={setStep1Data}
              templates={onboardingData.templates}
              validations={validations}
              isSubmitting={isSubmitting}
              isStepValid={isStepValid()}
              onSubmit={handleStep1Submit}
            />
          )}

          {/* PASO 2: Estilo Visual */}
          {currentStep === 1 && (
            <BrandingStep
              step2Data={step2Data}
              setStep2Data={setStep2Data}
              validations={validations}
              isSubmitting={isSubmitting}
              isStepValid={isStepValid()}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {/* PASO 3: Fotos */}
          {currentStep === 2 && (
            <ImagesStep
              step3Data={step3Data}
              setStep3Data={setStep3Data}
              galleryImageHints={galleryImageHints}
              settingsData={settingsData}
              isSubmitting={isSubmitting}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {/* PASO 4: Datos Públicos */}
          {currentStep === 3 && (
            <PublicStep
              step4Data={step4Data}
              setStep4Data={setStep4Data}
              isSubmitting={isSubmitting}
              onBack={goBack}
              onSubmit={handleBrandingSubmit}
            />
          )}
        </div>

      </div>

      {/* Negocios creados */}
      {onboardingData.businesses.length > 0 && (
        <section className="w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-card-foreground mb-5">Negocios creados</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {onboardingData.businesses.map((business) => (
              <div
                key={business.slug}
                className="rounded-2xl border border-border/60 bg-background p-4"
              >
                <p className="font-semibold text-foreground">{business.name}</p>
                <p className="text-sm text-muted-foreground">/{business.slug}</p>
                <p className="text-sm text-muted-foreground">{business.phone}</p>

                <div className="mt-4 flex flex-col gap-2">
                  <form
                    action={async () => {
                      const formData = new FormData();
                      formData.append("businessSlug", business.slug);
                      await activateLocalBusinessAction(formData);
                    }}
                  >
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-10 w-full"
                      )}
                    >
                      Abrir en admin
                    </button>
                  </form>
                  <Link
                    href={`/${business.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-10 w-full justify-center"
                    )}
                  >
                    Ver sitio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

