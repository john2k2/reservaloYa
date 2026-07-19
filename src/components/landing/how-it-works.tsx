"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { SectionTitle } from "@/components/layout/section-title";

const steps = [
  {
    number: "01",
    title: "Tu cliente entra a tu página",
    description:
      "Desde Instagram, WhatsApp o Google. Ve tus servicios, precios y disponibilidad al instante.",
  },
  {
    number: "02",
    title: "Elegí servicio, día y horario",
    description:
      "Seleccioná lo que necesita sin preguntar. Solo horarios reales disponibles, sin pisadas.",
  },
  {
    number: "03",
    title: "Recibís confirmación y recordatorios",
    description:
      "Confirmación por email al instante y recordatorio 24 hs antes. Menos ausencias, mejor ocupación.",
  },
];

export function HowItWorksSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  return (
    <section
      id="como-funciona"
      className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
    >
      <AnimatedSection>
        <SectionTitle
          eyebrow="Cómo funciona"
          title="Cómo funciona ReservaYa: turnos online en 3 pasos"
          description="Sin apps que descargar ni registros complejos. Simple para tus clientes, claro para vos."
          headingLevel={headingLevel}
        />
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <ol className="mt-12 divide-y divide-rule border-y border-rule sm:mt-16">
          {steps.map((step) => (
            <li
              key={step.number}
              className="grid gap-3 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8"
            >
              <span className="font-mono text-sm font-semibold tracking-wider text-sello">
                {step.number}
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-rule px-8 text-sm font-semibold text-foreground",
              "transition-colors hover:bg-secondary/50"
            )}
          >
            Probar el flujo de reserva
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
