"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function GalleryLightbox({
  images,
}: {
  images: { url: string; alt: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const openLightbox = useCallback((index: number) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  // Mover focus al dialog cuando abre, restaurar cuando cierra
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para que el DOM esté listo
      const t = setTimeout(() => closeButtonRef.current?.focus(), 10);
      return () => clearTimeout(t);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      if (e.key === "ArrowRight") { nextImage(); return; }
      if (e.key === "ArrowLeft") { prevImage(); return; }

      // Focus trap: Tab / Shift+Tab dentro del dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeLightbox, nextImage, prevImage]);

  // Attach click handlers a los items de la galería externos
  useEffect(() => {
    const galleryItems = document.querySelectorAll("[data-lightbox-index]");

    const handleClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const index = parseInt(target.dataset.lightboxIndex ?? "0", 10);
      openLightbox(index);
    };

    galleryItems.forEach((item) => item.addEventListener("click", handleClick));
    return () => galleryItems.forEach((item) => item.removeEventListener("click", handleClick));
  }, [images, openLightbox]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const current = images[currentIndex];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de imágenes - ${current?.alt || `foto ${currentIndex + 1}`}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={closeLightbox}
    >
      {/* Cerrar */}
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Cerrar galería"
      >
        <X className="size-6" aria-hidden="true" />
      </button>

      {/* Anterior */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          type="button"
          className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
      )}

      {/* Imagen */}
      <div
        className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
        style={{ width: "90vw", height: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            sizes="90vw"
            className="rounded-lg object-contain"
            priority
          />
        )}
        {current?.alt && (
          <p className="absolute -bottom-8 left-0 right-0 text-center text-sm text-white/80">
            {current.alt}
          </p>
        )}
      </div>

      {/* Siguiente */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          type="button"
          className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Siguiente imagen"
        >
          <ChevronRight className="size-6" aria-hidden="true" />
        </button>
      )}

      {/* Indicadores */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2" aria-label="Miniaturas de galería">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              aria-current={idx === currentIndex ? "true" : undefined}
              aria-label={`Ver imagen ${idx + 1}${img.alt ? `: ${img.alt}` : ""}`}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={cn(
                "size-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                idx === currentIndex ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
