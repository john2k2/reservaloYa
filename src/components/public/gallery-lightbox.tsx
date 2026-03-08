"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function GalleryLightbox({
  images,
}: {
  images: { url: string; alt: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeLightbox, nextImage, prevImage]);

  // Attach click handlers to gallery items
  useEffect(() => {
    const galleryItems = document.querySelectorAll("[data-lightbox-index]");
    
    const handleClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const index = parseInt(target.dataset.lightboxIndex || "0", 10);
      openLightbox(index);
    };

    galleryItems.forEach((item) => {
      item.addEventListener("click", handleClick);
    });

    return () => {
      galleryItems.forEach((item) => {
        item.removeEventListener("click", handleClick);
      });
    };
  }, [images, openLightbox]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={closeLightbox}
    >
      <button
        onClick={closeLightbox}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X className="size-6" />
      </button>
      
      <button
        onClick={(e) => { e.stopPropagation(); prevImage(); }}
        className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        aria-label="Imagen anterior"
      >
        <ChevronLeft className="size-6" />
      </button>

      <div className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex]?.url}
          alt={images[currentIndex]?.alt}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
        <p className="mt-4 text-center text-sm text-white/80">
          {images[currentIndex]?.alt}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); nextImage(); }}
        className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        aria-label="Siguiente imagen"
      >
        <ChevronRight className="size-6" />
      </button>

      <div className="absolute bottom-6 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={cn(
              "size-2 rounded-full transition-colors",
              idx === currentIndex ? "bg-white" : "bg-white/40"
            )}
            aria-label={`Ir a imagen ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
