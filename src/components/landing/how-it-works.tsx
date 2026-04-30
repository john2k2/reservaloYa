"use client";

import Link from "next/link";
import { Calendar, Smartphone, Bell, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { SectionTitle } from "@/components/layout/section-title";

const steps = [
  {
    icon: Smartphone,
    title: "Tu cliente entra a tu página",
    description: "Desde Instagram, WhatsApp o Google. Ve tus servicios, precios y disponibilidad al instante.",
  },
  {
    icon: Calendar,
    title: "Elegí servicio, día y horario",
    description: "El cliente selecciona lo que necesita sin preguntar. Solo horarios reales disponibles, sin pisadas.",
  },
  {
    icon: Bell,
    title: "Recibí confirmación y recordatorios",
    description: "Confirmación por email al instante + recordatorio 24hs antes. Menos ausencias, mejor ocupación.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <AnimatedSection>
        <SectionTitle
          eyebrow="Cómo funciona"
          title="Tu cliente reserva en 3 pasos."
          description="Sin apps que descargar, sin registros complejos. Simple para ellos, poderoso para vos."
        />
      </AnimatedSection>

      <div className="mt-10 sm:mt-16 grid gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <AnimatedSection
            key={step.title}
            delay={index * 150}
            animation={index === 0 ? "slideInLeft" : index === 2 ? "slideInRight" : "fadeInUp"}
          >
            <article className="group relative flex flex-col items-center text-center">
              <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                <step.icon className="size-6 sm:size-7 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <div className="mt-4 sm:mt-6 flex items-center gap-2">
                <span className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-secondary text-xs font-bold transition-colors group-hover:bg-foreground group-hover:text-background">
                  {index + 1}
                </span>
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
              </div>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">{step.description}</p>
            </article>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={500}>
        <div className="mt-8 sm:mt-12 text-center">
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 sm:h-12 rounded-full px-6 sm:px-8 transition-all hover:bg-foreground hover:text-background hover:scale-105"
            )}
          >
            Probar el flujo de reserva
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
