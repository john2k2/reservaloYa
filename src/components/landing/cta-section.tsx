"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <AnimatedSection animation="fadeInScale">
        <div className="rounded-3xl bg-gradient-to-br from-foreground via-foreground to-gray-800 p-8 text-background sm:p-12 md:p-16 relative overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl animate-float" />
            <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl animate-float delay-500" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empezá a ordenar tus turnos hoy.
            </h2>
            <p className="mt-4 text-lg text-background/70">
              Probá la demo gratis. Sin tarjeta. Sin compromiso. En 2 minutos ves cómo funciona.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {/* Botón primario - Demo */}
              <Link
                href={`/${demoBusinessSlug}`}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "h-12 rounded-full px-8",
                  "bg-white text-gray-900 font-medium",
                  "border border-transparent",
                  "transition-all duration-200",
                  "hover:bg-gray-100 hover:scale-105",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                )}
              >
                Probar demo gratis
                <ArrowRight className="size-4" />
              </Link>

              {/* Botón secundario - WhatsApp */}
              <a
                href="https://wa.me/541155550199"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center",
                  "h-12 rounded-full px-6",
                  "bg-transparent text-background font-medium",
                  "border border-white/30",
                  "transition-all duration-200",
                  "hover:bg-white/10 hover:border-white/50 hover:scale-105",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                )}
              >
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
