"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Plug, Save, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { getPaletteIdFromColors } from "@/constants/branding-palettes";

import {
  disconnectMercadoPagoInlineAction,
  saveOnboardingBrandingInlineAction,
  updateOnboardedBusinessInlineAction,
} from "./actions";
import { EditBusinessTab } from "./components/edit-business-tab";
import { EditImagesTab } from "./components/edit-images-tab";
import { EditIntegrationsTab } from "./components/edit-integrations-tab";
import { EditPublicTab } from "./components/edit-public-tab";
import { EditStyleTab } from "./components/edit-style-tab";

interface EditBusinessPageProps {
  business: {
    slug: string;
    name: string;
    phone: string;
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
}

const validations = {
  name: (value: string) => {
    if (value.length < 3) return "Minimo 3 caracteres";
    if (value.length > 120) return "Maximo 120 caracteres";
    return null;
  },
  phone: (value: string) => {
    if (value.length < 6) return "Minimo 6 caracteres";
    if (value.length > 40) return "Maximo 40 caracteres";
    return null;
  },
  email: (value: string) => {
    if (!value) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email invalido";
    return null;
  },
  address: (value: string) => {
    if (value.length < 4) return "Minimo 4 caracteres";
    if (value.length > 160) return "Maximo 160 caracteres";
    return null;
  },
  badge: (value: string) => {
    if (value.length < 3) return "Minimo 3 caracteres";
    if (value.length > 80) return "Maximo 80 caracteres";
    return null;
  },
  eyebrow: (value: string) => {
    if (value.length < 3) return "Minimo 3 caracteres";
    if (value.length > 120) return "Maximo 120 caracteres";
    return null;
  },
  headline: (value: string) => {
    if (value.length < 12) return "Minimo 12 caracteres";
    if (value.length > 160) return "Maximo 160 caracteres";
    return null;
  },
  description: (value: string) => {
    if (value.length < 20) return "Minimo 20 caracteres";
    if (value.length > 320) return "Maximo 320 caracteres";
    return null;
  },
  cta: (value: string) => {
    if (value.length < 2) return "Minimo 2 caracteres";
    if (value.length > 40) return "Maximo 40 caracteres";
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

export default function EditBusinessPage({ business, settingsData }: EditBusinessPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"business" | "style" | "images" | "public" | "integrations">(
    settingsData.defaultTab ?? "business"
  );

  const [businessData, setBusinessData] = useState({
    name: business.name,
    phone: business.phone,
    email: settingsData.email,
    address: settingsData.address,
    cancellationPolicy: settingsData.cancellationPolicy ?? "",
    autoConfirmBookings: settingsData.autoConfirmBookings ?? false,
  });

  const currentPaletteId = getPaletteIdFromColors({
    accent: settingsData.profile.accent,
    accentSoft: settingsData.profile.accentSoft,
    surfaceTint: settingsData.profile.surfaceTint,
  });

  const [styleData, setStyleData] = useState({
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
    enableDarkMode: settingsData.profile.enableDarkMode ?? false,
    darkModeColors: settingsData.profile.darkModeColors ?? {
      accent: settingsData.profile.accent,
      accentSoft: "#27272a",
      surfaceTint: "#18181b",
      background: "#111111",
      foreground: "#fafafa",
      card: "#1a1a1a",
      cardForeground: "#fafafa",
    },
  });

  const [imageData, setImageData] = useState<{
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

  const [publicData, setPublicData] = useState({
    instagram: settingsData.profile.instagram ?? "",
    facebook: settingsData.profile.facebook ?? "",
    tiktok: settingsData.profile.tiktok ?? "",
    website: settingsData.profile.website ?? "",
    mapQuery: settingsData.profile.mapQuery ?? settingsData.address,
  });

  const handleSaveAll = useCallback(async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const businessFormData = new FormData();
      businessFormData.append("businessSlug", business.slug);
      businessFormData.append("name", businessData.name);
      businessFormData.append("phone", businessData.phone);
      businessFormData.append("email", businessData.email);
      businessFormData.append("address", businessData.address);
      businessFormData.append("cancellationPolicy", businessData.cancellationPolicy);
      if (businessData.autoConfirmBookings) {
        businessFormData.append("autoConfirmBookings", "on");
      }

      await updateOnboardedBusinessInlineAction(businessFormData);

      const brandingFormData = new FormData();
      brandingFormData.append("businessSlug", business.slug);
      brandingFormData.append("palette", styleData.palette);
      brandingFormData.append("customAccent", styleData.customAccent);
      brandingFormData.append("customAccentSoft", styleData.customAccentSoft);
      brandingFormData.append("customSurfaceTint", styleData.customSurfaceTint);
      brandingFormData.append("badge", styleData.badge);
      brandingFormData.append("eyebrow", styleData.eyebrow);
      brandingFormData.append("headline", styleData.headline);
      brandingFormData.append("description", styleData.description);
      brandingFormData.append("primaryCta", styleData.primaryCta);
      brandingFormData.append("secondaryCta", styleData.secondaryCta);
      brandingFormData.append("enableDarkMode", String(styleData.enableDarkMode));
      brandingFormData.append("darkModeColors", JSON.stringify(styleData.darkModeColors));
      brandingFormData.append("instagram", publicData.instagram);
      brandingFormData.append("facebook", publicData.facebook);
      brandingFormData.append("tiktok", publicData.tiktok);
      brandingFormData.append("website", publicData.website);
      brandingFormData.append("mapQuery", publicData.mapQuery);

      if (imageData.logo) brandingFormData.append("logoFile", imageData.logo);
      if (imageData.hero) brandingFormData.append("heroFile", imageData.hero);
      brandingFormData.append("clearLogoFile", String(imageData.logoCleared));
      brandingFormData.append("clearHeroFile", String(imageData.heroCleared));
      imageData.gallery.forEach((item, i) => {
        if (item.file) brandingFormData.append(`galleryFile${i + 1}`, item.file);
        brandingFormData.append(`galleryAlt${i + 1}`, item.alt.trim());
        brandingFormData.append(`clearGalleryFile${i + 1}`, String(item.cleared));
      });

      await saveOnboardingBrandingInlineAction(brandingFormData);

      setSuccessMessage("Cambios guardados correctamente");
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron guardar los cambios."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [business.slug, businessData, styleData, imageData, publicData, router]);

  const tabs = [
    { id: "business" as const, label: "Negocio", icon: Store, description: "Datos básicos" },
    { id: "style" as const, label: "Estilo", icon: Store, description: "Colores y textos" },
    { id: "images" as const, label: "Fotos", icon: Store, description: "Logo y galería" },
    { id: "public" as const, label: "Público", icon: Store, description: "Redes y contacto" },
    { id: "integrations" as const, label: "Integraciones", icon: Plug, description: "Pagos y más" },
  ];

  return (
    <div className="flex min-h-full flex-col items-center space-y-6 sm:space-y-8 bg-background pb-10">
      <section className="w-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Store aria-hidden="true" className="size-3.5" />
              Editar negocio
            </div>
            <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              {business.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
              Modificá los datos, colores, textos o imágenes de tu página. Los cambios se aplican
              inmediatamente al guardar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full gap-2 sm:w-auto"
              )}
            >
              Ver página
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
            <button
              onClick={handleSaveAll}
              disabled={isSubmitting}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 w-full gap-2 sm:w-auto",
                isSubmitting && "cursor-not-allowed opacity-50"
              )}
            >
              {isSubmitting ? (
                <>
                  <Save className="size-4 animate-pulse" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Guardar todo
                </>
              )}
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-success/20 bg-success/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-success" />
              <p className="text-sm font-medium text-success">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 dark:border-red-400/20 dark:bg-red-400/10">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{errorMessage}</p>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:mt-8 sm:grid-cols-2 xl:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex min-h-11 w-full flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all sm:min-h-[4.5rem]",
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="size-4" />
                <span>{tab.label}</span>
              </div>
              <span
                className={cn(
                  "text-xs",
                  activeTab === tab.id ? "text-background/80" : "text-muted-foreground"
                )}
              >
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="w-full">
        <div className="space-y-6">
          {activeTab === "business" && (
            <EditBusinessTab
              businessData={businessData}
              setBusinessData={setBusinessData}
              validations={validations}
            />
          )}

          {activeTab === "style" && (
            <EditStyleTab
              styleData={styleData}
              setStyleData={setStyleData}
              validations={validations}
            />
          )}

          {activeTab === "images" && (
            <EditImagesTab
              imageData={imageData}
              setImageData={setImageData}
              galleryImageHints={galleryImageHints}
              settingsData={settingsData}
            />
          )}

          {activeTab === "public" && (
            <EditPublicTab publicData={publicData} setPublicData={setPublicData} />
          )}

          {activeTab === "integrations" && (
            <EditIntegrationsTab
              businessSlug={business.slug}
              mpConnected={settingsData.mpConnected ?? false}
              mpCollectorId={settingsData.mpCollectorId}
              mpOAuthUrl={settingsData.mpOAuthUrl ?? null}
              onDisconnect={async () => {
                const fd = new FormData();
                fd.append("businessSlug", business.slug);
                await disconnectMercadoPagoInlineAction(fd);
                router.refresh();
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
