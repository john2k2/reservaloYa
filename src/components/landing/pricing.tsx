"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

const pricingItems = [
  "Landing pública profesional del negocio",
  "Reserva online con horarios en tiempo real",
  "Panel admin con agenda y clientes",
  "Recordatorios automáticos por email",
  "Soporte técnico incluido",
];

export function PricingSection() {
  return (
    <section id="precios" className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
      <AnimatedSection>
        <div className="flex flex-col items-center text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Precios
          </p>
          <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
            Setup liviano, mensualidad simple.
          </h2>
          <p className="mt-4 max-w-[600px] text-lg text-muted-foreground">
            Modelo de facturación directo y transparente. Sin sorpresas ni costos ocultos.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={200} animation="fadeInScale">
        <div className="mt-12 flex justify-center">
          <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-gradient-to-b from-background to-secondary/20 p-8 shadow-lg md:p-10 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-foreground to-gray-700 px-4 py-1 text-xs font-bold uppercase tracking-wide text-background shadow-lg">
              Plan recomendado
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan Inicio</p>
              <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tighter">
                $150
                <span className="ml-2 text-lg font-medium tracking-normal text-muted-foreground">
                  USD
                </span>
              </div>
              <p className="text-sm text-muted-foreground">setup único</p>
              <div className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                + $20 USD / mes
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {pricingItems.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 transition-all duration-200 hover:translate-x-1"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href={`/${demoBusinessSlug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 w-full rounded-full font-medium transition-all duration-200 hover:scale-105"
                )}
              >
                Comenzar prueba gratis
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                Primer mes gratis. Cancelás cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
