import { fetchInstagramGallery } from "@/lib/instagram-oembed";
import { cn } from "@/lib/utils";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { ThumbnailImage } from "@/components/ui/optimized-image";

type PublicGallerySectionProps = {
  businessName: string;
  accent: string;
  mobileGalleryItems: number;
  gallery?: Array<{ url: string; alt: string }> | null;
  instagramGallery?: string[] | null;
};

function getGalleryAlt(input: {
  alt?: string | null;
  businessName: string;
  index: number;
  source: "instagram" | "gallery";
}) {
  const alt = input.alt?.trim();

  if (alt) {
    return alt;
  }

  return input.source === "instagram"
    ? `Foto ${input.index + 1} de ${input.businessName} en Instagram`
    : `Foto ${input.index + 1} de ${input.businessName}`;
}

/**
 * Sección de galería de la landing pública. Es un server component async
 * pensado para renderizarse dentro de un <Suspense>: el fetch de thumbnails
 * de Instagram (oEmbed) no bloquea hero + servicios.
 */
export async function PublicGallerySection({
  businessName,
  accent,
  mobileGalleryItems,
  gallery,
  instagramGallery,
}: PublicGallerySectionProps) {
  const instagramGalleryItems =
    instagramGallery && instagramGallery.length > 0
      ? await fetchInstagramGallery(instagramGallery)
      : [];

  const galleryItems =
    instagramGalleryItems.length > 0
      ? instagramGalleryItems.map((item, index) => ({
          url: item.thumbnailUrl,
          alt: getGalleryAlt({ businessName, index, source: "instagram" }),
          postUrl: item.postUrl,
        }))
      : (gallery ?? []).map((item, index) => ({
          ...item,
          alt: getGalleryAlt({
            alt: item.alt,
            businessName,
            index,
            source: "gallery",
          }),
          postUrl: null,
        }));

  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <section id="galeria" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:scroll-mt-24 sm:px-6 sm:py-16 lg:py-20">
      <div className="mb-6 sm:mb-10">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: accent }}>
          Galería
        </p>
        <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Así se vive la experiencia del negocio
        </h2>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((image, index) => {
          const inner = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden">
                <ThumbnailImage
                  src={image.url}
                  alt={image.alt || `Foto ${index + 1}`}
                  className="transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              {image.alt && (
                <div className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">{image.alt}</p>
                </div>
              )}
            </>
          );
          const className = cn(
            "group overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/60 bg-card shadow-sm",
            index >= mobileGalleryItems ? "hidden sm:block" : ""
          );
          return image.postUrl ? (
            <a
              key={`${image.url}-${index}`}
              href={image.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(className, "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
              aria-label={`${image.alt || `Foto ${index + 1}`} — abrir en Instagram`}
            >
              {inner}
            </a>
          ) : (
            <button
              key={`${image.url}-${index}`}
              type="button"
              className={cn(className, "cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
              aria-label={`${image.alt || `Foto ${index + 1}`} — abrir galería`}
              data-lightbox-index={index}
            >
              {inner}
            </button>
          );
        })}
      </div>
      {instagramGalleryItems.length === 0 && (
        <GalleryLightbox images={galleryItems} />
      )}
    </section>
  );
}

/**
 * Skeleton con la misma estructura (título + grid de tarjetas 4/3) para el
 * fallback del <Suspense>, evitando saltos de layout al streamear.
 */
export function PublicGallerySectionSkeleton({
  mobileGalleryItems = 2,
}: {
  mobileGalleryItems?: number;
}) {
  return (
    <section
      aria-hidden="true"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:scroll-mt-24 sm:px-6 sm:py-16 lg:py-20"
    >
      <div className="mb-6 sm:mb-10 animate-pulse">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="mt-2 sm:mt-3 h-7 w-72 max-w-full rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/60 bg-card shadow-sm animate-pulse",
              index >= mobileGalleryItems ? "hidden sm:block" : ""
            )}
          >
            <div className="aspect-[4/3] bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
