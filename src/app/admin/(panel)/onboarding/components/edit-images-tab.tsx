import type { Dispatch, SetStateAction } from "react";

import { ImagePlus } from "lucide-react";

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

type EditImagesTabProps = {
  imageData: ImageData;
  setImageData: Dispatch<SetStateAction<ImageData>>;
  galleryImageHints: string[];
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
  settingsData,
}: EditImagesTabProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
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
    </article>
  );
}
