"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fadeInUp" | "slideInLeft" | "slideInRight" | "fadeInScale";
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  animation = "fadeInUp",
}: AnimatedSectionProps) {
  // SSR: siempre visible (sin opacity-0) para evitar flicker en hidratación
  const [isVisible, setIsVisible] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    // Si el elemento ya está en el viewport al cargar, no lo ocultamos ni animamos
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return;

    // Está fuera del viewport: ocultarlo y observar cuándo entra
    setIsVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animationClass = {
    fadeInUp: "animate-fade-in-up",
    slideInLeft: "animate-slide-in-left",
    slideInRight: "animate-slide-in-right",
    fadeInScale: "animate-fade-in-scale",
  }[animation];

  return (
    <div
      ref={ref}
      className={cn(
        className,
        !isVisible && "opacity-0",
        shouldAnimate && animationClass
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
}
