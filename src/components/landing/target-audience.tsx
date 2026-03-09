"use client";

import { Check, Clock } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const idealFor = [
  "Barberías y peluquerías",
  "Centros de estética y skincare",
  "Spas y masajes",
  "Tatuadores y piercers",
  "Profesionales por turno",
];

const comingSoon = [
  "Consultorios médicos",
  "Dentistas y odontólogos",
  "Nutricionistas",
  "Kinesiólogos",
  "Gimnasios y entrenadores",
];

export function TargetAudienceSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
      <AnimatedSection>
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            ¿Para quién es?
          </p>
          <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
            Diseñado para tu tipo de negocio.
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Ideal for */}
        <AnimatedSection delay={100} animation="slideInLeft">
          <div className="group flex items-start gap-4 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-6 transition-all duration-300 hover:shadow-lg hover:border-green-500/40">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-500/20 transition-all group-hover:scale-110 group-hover:bg-green-500/30">
              <Check className="size-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ideal para</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {idealFor.map((item) => (
                  <li key={item} className="transition-all hover:translate-x-1 hover:text-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* Coming soon */}
        <AnimatedSection delay={200} animation="slideInRight">
          <div className="group flex items-start gap-4 rounded-2xl border border-muted bg-gradient-to-br from-secondary/30 to-transparent p-6 opacity-70 transition-all duration-300 hover:shadow-md">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary transition-all group-hover:scale-110">
              <Clock className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Próximamente</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {comingSoon.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
