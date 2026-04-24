"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import { CheckCircle2, ChevronDown, ImagePlus, Instagram, X, XCircle } from "lucide-react";

import { ImageUpload } from "./image-upload";

function isValidInstagramUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "www.instagram.com" || parsed.hostname === "instagram.com") &&
      (parsed.pathname.startsWith("/p/") || parsed.pathname.startsWith("/reel/"))
    );
  } catch {
    return false;
  }
}

type GalleryImageInput = {
  file: File | null;
  alt: string;
  cleared: boolean;
};

type ImageData = {
  logo: File | null;
  hero: File | null;
  logoCleared: boolean;
  heroCleared: boolean;
  gallery: GalleryImageInput[];
};

const INSTAGRAM_SLOTS = 9;

const INSTAGRAM_STEPS = [
  {
    step: "1",
    title: "Abrí la app de Instagram",
    detail: "Entrá a tu perfil y buscá el post o reel que querés mostrar.",
  },
  {
    step: "2",
    title: 'Tocá los tres puntos "···"',
    detail: 'En la esquina superior derecha del post, tocá el ícono de tres puntos.',
  },
  {
    step: "3",
    title: '"Copiar enlace"',
    detail: "Elegí esa opción del menú. El link se copia al portapapeles.",
  },
  {
    step: "4",
    title: "Pegá el link acá",
    detail: 'Tocá el campo de texto y elegí "Pegar". Debe verse como instagram.com/p/... o /reel/...',
  },
];

type EditImagesTabProps = {
  imageData: ImageData;
  setImageData: Dispatch<SetStateAction<ImageData>>;
  galleryImageHints: string[];
  instagramPosts: string[];
  setInstagramPosts: Dispatch<SetStateAction<string[]>>;
  settingsData: {
    profile: {
      logoUrl?: string | null;
      heroImageUrl?: string | null;
      gallery?: { url: string; alt: string }[] | null;
    };
  };
};

export function EditImagesTab({
  imageData,
  setImageData,
  galleryImageHints,
  instagramPosts,
  setInstagramPosts,
  settingsData,
}: EditImagesTabProps) {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  function updatePost(index: number, value: string) {
    setInstagramPosts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removePost(index: number) {
    setInstagramPosts((prev) => prev.filter((_, i) => i !== index));
  }

  function addSlot() {
    if (instagramPosts.length < INSTAGRAM_SLOTS) {
      setInstagramPosts((prev) => [...prev, ""]);
    }
  }

  const filledPosts = instagramPosts.filter((p) => p.trim().length > 0);

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm space-y-10">
      {/* Fotos subidas */}
      <div>
        <div className="mb-8 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
            <ImagePlus aria-hidden="true" className="size-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-card-foreground">Fotos del negocio</h3>
            <p className="mt-1 text-sm text-muted-foreground">Subí imágenes para personalizar tu página.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUpload
              id="logoFile"
              label="Logo del negocio"
              hint="Cuadrado o rectangular, se mostrara en el header"
              preview={
                imageData.logo
                  ? URL.createObjectURL(imageData.logo)
                  : imageData.logoCleared
                    ? null
                    : settingsData.profile.logoUrl
              }
              onChange={(file) => setImageData((d) => ({ ...d, logo: file, logoCleared: false }))}
              onClear={() => setImageData((d) => ({ ...d, logo: null, logoCleared: true }))}
            />

            <ImageUpload
              id="heroFile"
              label="Foto de portada"
              hint="Foto horizontal del local o experiencia"
              preview={
                imageData.hero
                  ? URL.createObjectURL(imageData.hero)
                  : imageData.heroCleared
                    ? null
                    : settingsData.profile.heroImageUrl
              }
              onChange={(file) => setImageData((d) => ({ ...d, hero: file, heroCleared: false }))}
              onClear={() => setImageData((d) => ({ ...d, hero: null, heroCleared: true }))}
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
                    imageData.gallery[index]?.file
                      ? URL.createObjectURL(imageData.gallery[index].file!)
                      : imageData.gallery[index]?.cleared
                        ? null
                        : settingsData.profile.gallery?.[index]?.url
                  }
                  descriptionValue={imageData.gallery[index]?.alt ?? ""}
                  descriptionPlaceholder={`Ej: ${hint}`}
                  onDescriptionChange={(value) =>
                    setImageData((d) => ({
                      ...d,
                      gallery: d.gallery.map((item, i) => (i === index ? { ...item, alt: value } : item)),
                    }))
                  }
                  onChange={(file) =>
                    setImageData((d) => ({
                      ...d,
                      gallery: d.gallery.map((item, i) => (i === index ? { ...item, file, cleared: false } : item)),
                    }))
                  }
                  onClear={() =>
                    setImageData((d) => ({
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
      </div>

      {/* Galería desde Instagram */}
      <div className="border-t border-border/40 pt-10">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
            <Instagram aria-hidden="true" className="size-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-card-foreground">Galería desde Instagram</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pegá hasta {INSTAGRAM_SLOTS} URLs de posts o reels públicos de tu cuenta. Si configurás esto, reemplaza las fotos subidas en la galería.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {instagramPosts.map((url, index) => {
            const trimmed = url.trim();
            const valid = trimmed.length > 0 && isValidInstagramUrl(trimmed);
            const invalid = trimmed.length > 0 && !valid;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      name={`instagramPost${index + 1}`}
                      value={url}
                      onChange={(e) => updatePost(index, e.target.value)}
                      placeholder="https://www.instagram.com/p/..."
                      className={`h-10 w-full rounded-xl border bg-background px-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 ${
                        invalid
                          ? "border-red-400/60 focus:ring-red-400/20"
                          : valid
                            ? "border-green-500/60 focus:ring-green-500/20"
                            : "border-border/60"
                      }`}
                    />
                    {valid && (
                      <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-green-500" />
                    )}
                    {invalid && (
                      <XCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-red-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePost(index)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Quitar post"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {invalid && (
                  <p className="pl-1 text-xs text-red-400">
                    Debe ser una URL de post o reel público de Instagram (instagram.com/p/... o /reel/...)
                  </p>
                )}
              </div>
            );
          })}

          {instagramPosts.length < INSTAGRAM_SLOTS && (
            <button
              type="button"
              onClick={addSlot}
              className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-border/60 bg-background px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <Instagram className="size-4" />
              Agregar post
            </button>
          )}

          {filledPosts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filledPosts.length} post{filledPosts.length !== 1 ? "s" : ""} configurado{filledPosts.length !== 1 ? "s" : ""}. Las imágenes se cargan automáticamente en tu página pública.
            </p>
          )}

          {/* Tutorial cómo copiar link desde el celular */}
          <div className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setTutorialOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-foreground">
                ¿Cómo copio el link desde el celular?
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${tutorialOpen ? "rotate-180" : ""}`}
              />
            </button>

            {tutorialOpen && (
              <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                {INSTAGRAM_STEPS.map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background mt-0.5">
                      {s.step}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                  El link tiene que empezar con <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">instagram.com/p/</code> o <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">instagram.com/reel/</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
