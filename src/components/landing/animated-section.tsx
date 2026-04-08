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
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [isVisible, setIsVisible] = useState(prefersReduced);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [prefersReduced]);

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
        isVisible && !prefersReduced && animationClass
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
