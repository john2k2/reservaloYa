"use client";

import type { Dispatch, SetStateAction } from "react";

import { ImagePlus, Instagram, X } from "lucide-react";

import { ImageUpload } from "./image-upload";

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
          {instagramPosts.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="url"
                name={`instagramPost${index + 1}`}
                value={url}
                onChange={(e) => updatePost(index, e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="button"
                onClick={() => removePost(index)}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Quitar post"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

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
        </div>
      </div>
    </article>
  );
}
