"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { demoBusinessOptions } from "@/constants/site";
import { AnimatedSection } from "./animated-section";

const demoProofPoints = [
  "Responsive en mobile y desktop",
  "Reprogramación y cancelación desde link",
  "Onboarding listo para nuevos negocios",
];

export function DemoSelector() {
  const demos = demoBusinessOptions.filter((option) => option.slug !== "barberia-demo");

  return (
    <section
      id="demos"
      className="mx-auto w-full max-w-5xl border-t border-rule px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <AnimatedSection>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Demos en vivo
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Negocios reales corriendo con ReservaYa.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Entrá a cualquiera y probá el flujo completo: reserva pública, panel admin y
            personalización.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <div className="mt-10 divide-y divide-rule border-y border-rule">
          {demos.map((option, index) => (
            <Link
              key={option.slug}
              href={`/${option.slug}`}
              className="group flex items-start justify-between gap-4 py-5 transition-colors hover:text-sello focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="min-w-0">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-sello">
                  DEMO {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-base font-semibold text-foreground group-hover:text-sello">
                  {option.label}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                  {option.category}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-sello" />
            </Link>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-8">
          {demoProofPoints.map((item) => (
            <p key={item} className="text-sm text-muted-foreground">
              <span className="mr-2 font-mono text-sello" aria-hidden="true">
                —
              </span>
              {item}
            </p>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
