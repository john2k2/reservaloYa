"use client";

import { X, Check } from "lucide-react";
import { AnimatedSection } from "./animated-section";

const beforeItems = [
  "WhatsApp explotado de mensajes",
  "Turnos pisados o olvidados",
  "Respondiendo a toda hora",
  "Clientes que no avisan si cancelan",
  "Sin imagen profesional online",
];

const afterItems = [
  "Página profesional de reservas",
  "Agenda organizada automáticamente",
  "Reservas 24/7 sin tu intervención",
  "Recordatorios automáticos por email",
  "Presencia digital de primer nivel",
];

export function BeforeAfterSection() {
  return (
    <section id="beneficios" className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
      <AnimatedSection>
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Antes vs Después
          </p>
          <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
            Menos caos, más control.
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Before */}
        <AnimatedSection delay={100} animation="slideInLeft">
          <div className="group rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 p-8 transition-all duration-300 hover:shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/20 transition-transform group-hover:scale-110">
                <X className="size-5 text-destructive" />
              </div>
              <span className="font-semibold text-destructive">Antes</span>
            </div>
            <ul className="space-y-4">
              {beforeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground transition-all hover:translate-x-1">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>

        {/* After */}
        <AnimatedSection delay={200} animation="slideInRight">
          <div className="group rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10 p-8 transition-all duration-300 hover:shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20 transition-transform group-hover:scale-110">
                <Check className="size-5 text-green-600" />
              </div>
              <span className="font-semibold text-green-600">Con ReservaYa</span>
            </div>
            <ul className="space-y-4">
              {afterItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground transition-all hover:translate-x-1">
                  <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
