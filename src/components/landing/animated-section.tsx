"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ocultar el elemento antes del primer paint si está fuera del viewport.
  // Usamos manipulación directa del DOM (no setState) para evitar cascading renders.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!alreadyVisible) el.style.opacity = "0";
  }, []);

  // Configurar el IntersectionObserver para mostrar el elemento al entrar al viewport.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "";
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
      className={cn(className, shouldAnimate && animationClass)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
}
