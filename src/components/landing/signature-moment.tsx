"use client";

import { AnimatedSection } from "./animated-section";

const beforeMessages = [
  "¿Tenés turno a las 3?",
  "No, a las 4 mejor",
  "¿Y el precio?",
  "¿Me confirmás?",
];

const afterMessages = [
  "Turno reservado",
  "Recordatorio enviado",
  "Cliente notificado",
  "Confirmado",
];

export function SignatureMoment() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-rule px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
      <AnimatedSection>
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sello">La diferencia</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            Dejá el caos atrás
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Vos dedicáte a lo que mejor hacés. Nosotros nos ocupamos de la organización.
          </p>
        </div>
      </AnimatedSection>

      <div className="mx-auto mt-14 grid max-w-4xl gap-10 md:grid-cols-2 md:gap-16">
        <AnimatedSection delay={80}>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Antes · WhatsApp
            </p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {beforeMessages.map((text) => (
                <li key={text} className="py-3.5 text-sm text-muted-foreground">
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={160}>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-sello">
              Después · ReservaYa
            </p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {afterMessages.map((text) => (
                <li key={text} className="py-3.5 font-mono text-sm text-foreground">
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
