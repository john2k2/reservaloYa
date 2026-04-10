"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { demoBusinessSlug } from "@/constants/site";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-16 sm:pb-20">
      <AnimatedSection animation="fadeInScale">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 text-card-foreground shadow-lg ring-1 ring-border sm:p-12 md:p-16">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Empezá a ordenar tus turnos hoy.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Mira un negocio en vivo, revisa el flujo completo y valida si encaja con tu negocio en pocos minutos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/${demoBusinessSlug}`}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "h-12 rounded-full px-8",
                  "bg-foreground text-background font-semibold",
                  "transition-all duration-200",
                  "hover:opacity-90 hover:scale-105",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                )}
              >
                Ver ejemplo en vivo
                <ArrowRight className="size-4" />
              </Link>

              <a
                href={getSiteWhatsAppHref("Hola, quiero hablar sobre ReservaYa.")}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center",
                  "h-12 rounded-full px-6",
                  "bg-secondary text-secondary-foreground font-medium",
                  "border border-input",
                  "transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:scale-105",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                )}
              >
                Hablar con ventas
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
