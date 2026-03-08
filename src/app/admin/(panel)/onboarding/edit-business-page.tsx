"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Palette,
  ImagePlus,
  Store,
  Globe,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  saveOnboardingBrandingInlineAction,
  updateOnboardedBusinessInlineAction,
} from "./actions";
import { brandingPalettes, getPaletteIdFromColors } from "@/constants/branding-palettes";
import { FormField } from "./components/form-field";
import { PaletteSelector } from "./components/palette-selector";
import { ImageUpload } from "./components/image-upload";
import { LivePreview } from "./components/live-preview";

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
    publicUrl: string;
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
      logoUrl?: string;
      heroImageUrl?: string;
    };
  };
}

// Validaciones
const validations = {
  name: (value: string) => {
    if (value.length < 3) return "Mínimo 3 caracteres";
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
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [activeTab, setActiveTab] = useState<"business" | "style" | "images" | "public">("business");

  // Datos del negocio (Paso 1)
  const [businessData, setBusinessData] = useState({
    name: business.name,
    phone: business.phone,
    email: settingsData.email,
    address: settingsData.address,
  });

  // Estilo y textos (Paso 2)
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
  });

  // Imágenes (Paso 3)
  const [imageData, setImageData] = useState<{
    logo: File | null;
    hero: File | null;
    gallery: GalleryImageInput[];
  }>({
    logo: null,
    hero: null,
    gallery: galleryImageHints.map((_, index) => ({
      file: null,
      alt: settingsData.profile.gallery?.[index]?.alt ?? "",
    })),
  });

  // Datos públicos (Paso 4)
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
      // 1. Guardar datos del negocio
      const businessFormData = new FormData();
      businessFormData.append("businessSlug", business.slug);
      businessFormData.append("name", businessData.name);
      businessFormData.append("phone", businessData.phone);
      businessFormData.append("email", businessData.email);
      businessFormData.append("address", businessData.address);

      await updateOnboardedBusinessInlineAction(businessFormData);

      // 2. Guardar branding
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
      brandingFormData.append("instagram", publicData.instagram);
      brandingFormData.append("facebook", publicData.facebook);
      brandingFormData.append("tiktok", publicData.tiktok);
      brandingFormData.append("website", publicData.website);
      brandingFormData.append("mapQuery", publicData.mapQuery);

      if (imageData.logo) brandingFormData.append("logoFile", imageData.logo);
      if (imageData.hero) brandingFormData.append("heroFile", imageData.hero);
      imageData.gallery.forEach((item, i) => {
        if (item.file) brandingFormData.append(`galleryFile${i + 1}`, item.file);
        brandingFormData.append(`galleryAlt${i + 1}`, item.alt.trim());
      });

      await saveOnboardingBrandingInlineAction(brandingFormData);

      setSuccessMessage("Cambios guardados correctamente");
      setPreviewRefreshToken((current) => current + 1);
      
      // Recargar la página para mostrar los datos actualizados
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
    { id: "style" as const, label: "Estilo", icon: Palette, description: "Colores y textos" },
    { id: "images" as const, label: "Fotos", icon: ImagePlus, description: "Logo y galería" },
    { id: "public" as const, label: "Público", icon: Globe, description: "Redes y contacto" },
  ];

  return (
    <div className="flex flex-col items-center space-y-8 pb-10">
      {/* Header */}
      <section className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Store aria-hidden="true" className="size-3.5" />
              Editar negocio
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {business.name}
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Modificá los datos, colores, textos o imágenes de tu página. Los cambios se aplican
              inmediatamente al guardar.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2")}
            >
              Ver página
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
            <button
              onClick={handleSaveAll}
              disabled={isSubmitting}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 gap-2",
                isSubmitting && "opacity-50 cursor-not-allowed"
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

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Contenido principal */}
      <div className="grid w-full gap-6 xl:grid-cols-[1fr_420px]">
        {/* Formulario según tab activa */}
        <div className="space-y-6">
          {/* TAB: Negocio */}
          {activeTab === "business" && (
            <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
                  <Store aria-hidden="true" className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">Datos del negocio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Información básica de tu negocio.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <FormField
                  id="name"
                  label="Nombre del negocio"
                  placeholder="Ej: Aura Studio Palermo"
                  required
                  value={businessData.name}
                  onChange={(value) => setBusinessData((d) => ({ ...d, name: value }))}
                  validate={validations.name}
                  hint="Este nombre aparecerá en el título de tu página"
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    id="phone"
                    label="WhatsApp"
                    type="tel"
                    placeholder="Ej: +54 11 5555 0000"
                    required
                    value={businessData.phone}
                    onChange={(value) => setBusinessData((d) => ({ ...d, phone: value }))}
                    validate={validations.phone}
                    hint="Con código de país para WhatsApp"
                  />

                  <FormField
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="Ej: hola@negocio.com"
                    value={businessData.email}
                    onChange={(value) => setBusinessData((d) => ({ ...d, email: value }))}
                    validate={validations.email}
                    hint="Para recibir notificaciones de turnos"
                  />
                </div>

                <FormField
                  id="address"
                  label="Dirección"
                  placeholder="Ej: Honduras 4821, Palermo"
                  required
                  value={businessData.address}
                  onChange={(value) => setBusinessData((d) => ({ ...d, address: value }))}
                  validate={validations.address}
                  hint="Dirección completa de tu local"
                />
              </div>
            </article>
          )}

          {/* TAB: Estilo */}
          {activeTab === "style" && (
            <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
                  <Palette aria-hidden="true" className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">Estilo visual</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Colores y textos de tu página.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-medium text-foreground mb-4">Paleta de colores</h4>
                  <PaletteSelector
                    palettes={brandingPalettes}
                    selectedId={styleData.palette}
                    onSelect={(id) => setStyleData((d) => ({ ...d, palette: id }))}
                  />

                  {styleData.palette === "custom" && (
                    <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
                      <p className="text-sm font-medium text-foreground mb-4">
                        Colores personalizados
                      </p>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="space-y-2">
                          <span className="text-sm text-muted-foreground">Principal</span>
                          <input
                            type="color"
                            value={styleData.customAccent}
                            onChange={(e) =>
                              setStyleData((d) => ({ ...d, customAccent: e.target.value }))
                            }
                            className="h-11 w-full rounded-md border border-border/70 bg-background p-1"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-muted-foreground">Suave</span>
                          <input
                            type="color"
                            value={styleData.customAccentSoft}
                            onChange={(e) =>
                              setStyleData((d) => ({ ...d, customAccentSoft: e.target.value }))
                            }
                            className="h-11 w-full rounded-md border border-border/70 bg-background p-1"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-muted-foreground">Fondo</span>
                          <input
                            type="color"
                            value={styleData.customSurfaceTint}
                            onChange={(e) =>
                              setStyleData((d) => ({ ...d, customSurfaceTint: e.target.value }))
                            }
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
                      placeholder="Ej: Estética y skincare"
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
                    label="Título principal"
                    required
                    value={styleData.headline}
                    onChange={(value) => setStyleData((d) => ({ ...d, headline: value }))}
                    validate={validations.headline}
                    maxLength={160}
                    hint="El título más importante de tu página"
                  />

                  <FormField
                    id="description"
                    label="Descripción"
                    type="textarea"
                    required
                    value={styleData.description}
                    onChange={(value) => setStyleData((d) => ({ ...d, description: value }))}
                    validate={validations.description}
                    maxLength={320}
                    hint="Una breve descripción de tu negocio"
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      id="primaryCta"
                      label="Botón principal"
                      placeholder="Ej: Reservar turno"
                      required
                      value={styleData.primaryCta}
                      onChange={(value) => setStyleData((d) => ({ ...d, primaryCta: value }))}
                      validate={validations.cta}
                      maxLength={40}
                      hint="Texto del botón principal"
                    />

                    <FormField
                      id="secondaryCta"
                      label="Botón secundario"
                      placeholder="Ej: Ver servicios"
                      required
                      value={styleData.secondaryCta}
                      onChange={(value) => setStyleData((d) => ({ ...d, secondaryCta: value }))}
                      validate={validations.cta}
                      maxLength={40}
                      hint="Texto del botón secundario"
                    />
                  </div>
                </section>
              </div>
            </article>
          )}

          {/* TAB: Fotos */}
          {activeTab === "images" && (
            <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
                  <ImagePlus aria-hidden="true" className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">Fotos del negocio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Subí imágenes para personalizar tu página.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageUpload
                    id="logoFile"
                    label="Logo del negocio"
                    hint="Cuadrado o rectangular, se mostrará en el header"
                    preview={
                      imageData.logo
                        ? URL.createObjectURL(imageData.logo)
                        : settingsData.profile.logoUrl
                    }
                    onChange={(file) => setImageData((d) => ({ ...d, logo: file }))}
                    onClear={() => setImageData((d) => ({ ...d, logo: null }))}
                  />

                  <ImageUpload
                    id="heroFile"
                    label="Foto de portada"
                    hint="Foto horizontal del local o experiencia"
                    preview={
                      imageData.hero
                        ? URL.createObjectURL(imageData.hero)
                        : settingsData.profile.heroImageUrl
                    }
                    onChange={(file) => setImageData((d) => ({ ...d, hero: file }))}
                    onClear={() => setImageData((d) => ({ ...d, hero: null }))}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-4">Galería (opcional)</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {galleryImageHints.map((hint, index) => (
                        <ImageUpload
                          key={index}
                          id={`galleryFile${index + 1}`}
                          label={`Foto ${index + 1}`}
                          hint={hint}
                          preview={
                            imageData.gallery[index]?.file
                              ? URL.createObjectURL(imageData.gallery[index].file!)
                              : settingsData.profile.gallery?.[index]?.url
                          }
                          descriptionValue={imageData.gallery[index]?.alt ?? ""}
                          descriptionPlaceholder={`Ej: ${hint}`}
                          onDescriptionChange={(value) =>
                            setImageData((d) => ({
                              ...d,
                              gallery: d.gallery.map((item, i) =>
                                i === index ? { ...item, alt: value } : item
                              ),
                            }))
                          }
                          onChange={(file) =>
                            setImageData((d) => ({
                              ...d,
                              gallery: d.gallery.map((item, i) =>
                                i === index ? { ...item, file } : item
                              ),
                            }))
                          }
                          onClear={() =>
                            setImageData((d) => ({
                              ...d,
                              gallery: d.gallery.map((item, i) =>
                                i === index ? { ...item, file: null } : item
                              ),
                            }))
                          }
                        />
                      ))}
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* TAB: Público */}
          {activeTab === "public" && (
            <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
                  <Globe aria-hidden="true" className="size-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">Datos públicos</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Redes sociales y dirección para el mapa.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    id="instagram"
                    label="Instagram"
                    placeholder="@tu.marca"
                    value={publicData.instagram}
                    onChange={(value) => setPublicData((d) => ({ ...d, instagram: value }))}
                    hint="Sin @, solo el nombre de usuario"
                  />

                  <FormField
                    id="facebook"
                    label="Facebook"
                    placeholder="tu.pagina"
                    value={publicData.facebook}
                    onChange={(value) => setPublicData((d) => ({ ...d, facebook: value }))}
                    hint="Usuario o nombre de pagina"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    id="tiktok"
                    label="TikTok"
                    placeholder="@tu.marca"
                    value={publicData.tiktok}
                    onChange={(value) => setPublicData((d) => ({ ...d, tiktok: value }))}
                    hint="Con o sin @"
                  />

                  <FormField
                    id="website"
                    label="Website (opcional)"
                    type="url"
                    placeholder="https://..."
                    value={publicData.website}
                    onChange={(value) => setPublicData((d) => ({ ...d, website: value }))}
                    hint="Si tenés otro sitio web"
                  />
                </div>

                <FormField
                  id="mapQuery"
                  label="Dirección para el mapa"
                  placeholder="Ej: Honduras 4821, Palermo, Buenos Aires"
                  value={publicData.mapQuery}
                  onChange={(value) => setPublicData((d) => ({ ...d, mapQuery: value }))}
                  hint="Esta dirección se usa para mostrar el mapa en tu página"
                />
              </div>
            </article>
          )}
        </div>

        {/* Panel de Preview */}
        <aside className="hidden xl:block">
          <div className="sticky top-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm h-[calc(100vh-6rem)]">
            <LivePreview
              businessSlug={business.slug}
              isActive={true}
              refreshToken={previewRefreshToken}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
