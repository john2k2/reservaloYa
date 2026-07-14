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
  "Presencia digital clara y compartible",
];

export function BeforeAfterSection() {
  return (
    <section id="beneficios" className="mx-auto w-full max-w-6xl border-t border-rule px-4 py-16 sm:px-6 md:py-24">
      <AnimatedSection>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Antes vs después
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Menos caos, más control.
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
        <AnimatedSection delay={80}>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Antes
            </p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {beforeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 py-3.5 text-muted-foreground">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive/70" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={160}>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-sello">
              Con ReservaYa
            </p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {afterItems.map((item) => (
                <li key={item} className="flex items-start gap-3 py-3.5 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-sello" aria-hidden="true" />
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
