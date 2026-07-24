"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { getPaletteIdFromColors } from "@/constants/branding-palettes";
import {
  activateLocalBusinessAction,
  createOnboardedBusinessAction,
  saveOnboardingBrandingAction,
  updateOnboardedBusinessAction,
} from "./actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { BrandingStep } from "./components/branding-step";
import { BusinessStep } from "./components/business-step";
import { OnboardingStepper, type OnboardingStep } from "./components/onboarding-stepper";
import { ImagesStep } from "./components/images-step";
import { OnboardingStatusBanner } from "./components/onboarding-status-banner";
import { PublicStep } from "./components/public-step";
import EditBusinessPage from "./edit-business-page";

// Validaciones
const validations = {
  name: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  slug: (value: string) => {
    if (!value) return null;
    if (!/^[a-z0-9-]+$/.test(value)) return "Solo letras minúsculas, números y guiones";
    if (value.length < 2) return "Mínimo 2 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  phone: (value: string) => {
    if (value.length < 6) return "Mínimo 6 caracteres";
    if (value.length > 40) return "Máximo 40 caracteres";
    return null;
  },
  email: (value: string) => {
    if (!value) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
    return null;
  },
  address: (value: string) => {
    if (value.length < 4) return "Mínimo 4 caracteres";
    if (value.length > 160) return "Máximo 160 caracteres";
    return null;
  },
  badge: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 80) return "Máximo 80 caracteres";
    return null;
  },
  eyebrow: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 120) return "Máximo 120 caracteres";
    return null;
  },
  headline: (value: string) => {
    if (value.length < 12) return "Mínimo 12 caracteres";
    if (value.length > 160) return "Máximo 160 caracteres";
    return null;
  },
  description: (value: string) => {
    if (value.length < 20) return "Mínimo 20 caracteres";
    if (value.length > 320) return "Máximo 320 caracteres";
    return null;
  },
  cta: (value: string) => {
    if (value.length < 2) return "Mínimo 2 caracteres";
    if (value.length > 40) return "Máximo 40 caracteres";
    return null;
  },
};

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

interface OnboardingPageClientProps {
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

export default function OnboardingPageClient({
  onboardingData,
  settingsData,
  searchParams,
}: OnboardingPageClientProps) {
  const error = searchParams.error;
  const created = searchParams.created;
  const brandingSaved = searchParams.brandingSaved;
  const businessUpdated = searchParams.businessUpdated;

  const createdBusiness = onboardingData.businesses.find((b) => b.slug === created);
  const activeBusinessSlug = onboardingData.activeBusinessSlug ?? settingsData.businessSlug;

  // Detectar si hay negocios existentes para modo edición
  const hasExistingBusiness = onboardingData.businesses.length > 0;

  // Estado del paso actual
  const [currentStep, setCurrentStep] = useState(0);
  // Inicializar pasos completados: si hay negocio existente, todos los pasos están completos
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    if (hasExistingBusiness) {
      return new Set([0, 1, 2, 3]);
    }
    return new Set();
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar datos del negocio activo para precargar
  const activeBusiness = hasExistingBusiness
    ? onboardingData.businesses.find((b) => b.slug === activeBusinessSlug) || onboardingData.businesses[0]
    : null;

  // Estado del formulario - Paso 1
  const [step1Data, setStep1Data] = useState({
    templateSlug: "demo-estetica",
    name: activeBusiness?.name ?? "",
    slug: activeBusiness?.slug ?? "",
    phone: activeBusiness?.phone ?? "",
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

  // Submit del paso 1
  const handleStep1Submit = useCallback(async () => {
    if (!isStepValid()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    
    if (hasExistingBusiness && activeBusinessSlug) {
      // Actualizar negocio existente
      formData.append("businessSlug", activeBusinessSlug);
      formData.append("name", step1Data.name);
      formData.append("phone", step1Data.phone);
      formData.append("email", step1Data.email);
      formData.append("address", step1Data.address);
      try {
        await updateOnboardedBusinessAction(formData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Crear nuevo negocio
      formData.append("templateSlug", step1Data.templateSlug);
      formData.append("name", step1Data.name);
      formData.append("slug", step1Data.slug);
      formData.append("phone", step1Data.phone);
      formData.append("email", step1Data.email);
      formData.append("address", step1Data.address);
      try {
        await createOnboardedBusinessAction(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [step1Data, isStepValid, hasExistingBusiness, activeBusinessSlug]);

  // Submit del paso 2-4 (branding)
  const handleBrandingSubmit = useCallback(async () => {
    setIsSubmitting(true);
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

    try {
      await saveOnboardingBrandingAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeBusinessSlug, step2Data, step3Data, step4Data]);

  // Guardar todo - actualiza datos del negocio y branding
  const handleSaveAll = useCallback(async () => {
    // Validar explícitamente los datos del paso 1 (datos del negocio)
    const isStep1Valid = 
      step1Data.name.length >= 3 &&
      step1Data.phone.length >= 6 &&
      step1Data.address.length >= 4 &&
      !validations.name(step1Data.name) &&
      !validations.phone(step1Data.phone) &&
      !validations.address(step1Data.address) &&
      (!step1Data.slug || !validations.slug(step1Data.slug)) &&
      (!step1Data.email || !validations.email(step1Data.email));

    if (!isStep1Valid) {
      // Si el paso 1 no es válido, navegar al paso 1 para mostrar errores
      setCurrentStep(0);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Primero actualizar datos básicos del negocio
      const step1FormData = new FormData();
      step1FormData.append("businessSlug", activeBusinessSlug);
      step1FormData.append("name", step1Data.name);
      step1FormData.append("phone", step1Data.phone);
      step1FormData.append("email", step1Data.email);
      step1FormData.append("address", step1Data.address);
      
      await updateOnboardedBusinessAction(step1FormData);
      
      // Luego actualizar branding (colores, textos, imágenes, redes)
      const brandingFormData = new FormData();
      brandingFormData.append("businessSlug", activeBusinessSlug);
      brandingFormData.append("palette", step2Data.palette);
      brandingFormData.append("customAccent", step2Data.customAccent);
      brandingFormData.append("customAccentSoft", step2Data.customAccentSoft);
      brandingFormData.append("customSurfaceTint", step2Data.customSurfaceTint);
      brandingFormData.append("badge", step2Data.badge);
      brandingFormData.append("eyebrow", step2Data.eyebrow);
      brandingFormData.append("headline", step2Data.headline);
      brandingFormData.append("description", step2Data.description);
      brandingFormData.append("primaryCta", step2Data.primaryCta);
      brandingFormData.append("secondaryCta", step2Data.secondaryCta);
      brandingFormData.append("instagram", step4Data.instagram);
      brandingFormData.append("facebook", step4Data.facebook);
      brandingFormData.append("tiktok", step4Data.tiktok);
      brandingFormData.append("website", step4Data.website);
      brandingFormData.append("mapQuery", step4Data.mapQuery);

      if (step3Data.logo) brandingFormData.append("logoFile", step3Data.logo);
      if (step3Data.hero) brandingFormData.append("heroFile", step3Data.hero);
      brandingFormData.append("clearLogoFile", String(step3Data.logoCleared));
      brandingFormData.append("clearHeroFile", String(step3Data.heroCleared));
      step3Data.gallery.forEach((item, i) => {
        if (item.file) brandingFormData.append(`galleryFile${i + 1}`, item.file);
        brandingFormData.append(`galleryAlt${i + 1}`, item.alt.trim());
        brandingFormData.append(`clearGalleryFile${i + 1}`, String(item.cleared));
      });

      await saveOnboardingBrandingAction(brandingFormData);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeBusinessSlug, step1Data, step2Data, step3Data, step4Data]);

  // Si hay negocio existente, mostrar el editor simple en lugar del wizard
  if (hasExistingBusiness && activeBusiness) {
    return (
      <EditBusinessPage
        business={activeBusiness}
        settingsData={settingsData}
      />
    );
  }

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
                {hasExistingBusiness ? "Editá tu página" : "Configura tu página paso a paso"}
              </h2>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground">
                {hasExistingBusiness 
                  ? "Modificá los datos, colores, textos o imágenes. Guardá todos los cambios cuando termines."
                  : "Completa los 4 pasos para dejar tu página pública lista. Puedes volver atrás y editar en cualquier momento."}
              </p>
            </div>
            {hasExistingBusiness && (
              <button
                onClick={handleSaveAll}
                disabled={isSubmitting}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 shrink-0",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <CheckCircle2 className="size-4 mr-2 animate-pulse" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    Guardar todo
                  </>
                )}
              </button>
            )}
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
              hasExistingBusiness={hasExistingBusiness}
              step1Data={step1Data}
              setStep1Data={setStep1Data}
              templates={onboardingData.templates}
              validations={validations}
              isSubmitting={isSubmitting}
              isStepValid={isStepValid()}
              onNext={goNext}
              onSubmit={handleStep1Submit}
            />
          )}

          {/* PASO 2: Estilo Visual */}
          {currentStep === 1 && (
            <BrandingStep
              step2Data={step2Data}
              setStep2Data={setStep2Data}
              validations={validations}
              hasExistingBusiness={hasExistingBusiness}
              isSubmitting={isSubmitting}
              isStepValid={isStepValid()}
              onBack={goBack}
              onNext={goNext}
              onSaveAll={handleSaveAll}
            />
          )}

          {/* PASO 3: Fotos */}
          {currentStep === 2 && (
            <ImagesStep
              step3Data={step3Data}
              setStep3Data={setStep3Data}
              galleryImageHints={galleryImageHints}
              settingsData={settingsData}
              hasExistingBusiness={hasExistingBusiness}
              isSubmitting={isSubmitting}
              onBack={goBack}
              onNext={goNext}
              onSaveAll={handleSaveAll}
            />
          )}

          {/* PASO 4: Datos Públicos */}
          {currentStep === 3 && (
            <PublicStep
              step4Data={step4Data}
              setStep4Data={setStep4Data}
              hasExistingBusiness={hasExistingBusiness}
              isSubmitting={isSubmitting}
              onBack={goBack}
              onSubmit={hasExistingBusiness ? handleSaveAll : handleBrandingSubmit}
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

