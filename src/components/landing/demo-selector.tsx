"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { demoBusinessOptions } from "@/constants/site";
import { AnimatedSection } from "./animated-section";

const demoProofPoints = [
  "Responsive en mobile y desktop",
  "Reprogramación y cancelación desde link",
  "Onboarding listo para nuevos negocios",
];

export function DemoSelector() {
  return (
    <section className="mx-auto w-full max-w-5xl border-t border-rule px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <AnimatedSection>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Lo que vas a ver
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
            Ejemplos en vivo, no capturas de pantalla.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Cuatro negocios reales corriendo con ReservaYa hoy. Entrá a cualquiera y probá el flujo
            completo: reserva pública, panel admin y personalización.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
          {demoBusinessOptions
            .filter((option) => option.slug !== "barberia-demo")
            .map((option, index) => (
            <Link
              key={option.slug}
              href={`/${option.slug}`}
              className="group relative rounded-2xl border border-border/70 bg-card/80 p-5 pl-6 text-left transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-foreground/20 hover:bg-secondary/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{
                animationDelay: `${200 + index * 100}ms`,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
              }}
            >
              <span className="font-mono text-[11px] font-semibold tracking-wider text-sello">
                DEMO #{String(index + 1).padStart(2, "0")}
              </span>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {option.category}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={400}>
        <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:gap-8">
          {demoProofPoints.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-sello" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
