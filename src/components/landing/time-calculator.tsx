"use client";

import { AnimatedSection } from "./animated-section";
import { AnimatedCounter } from "./animated-counter";

export function TimeCalculatorSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-rule px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <AnimatedSection>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¿Cuánto tiempo perdés respondiendo mensajes?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Si respondés{" "}
            <span className="font-semibold text-foreground">10 mensajes</span> de turnos por día…
          </p>
        </div>
      </AnimatedSection>

      <div className="mt-12 flex flex-wrap items-start justify-center gap-6 sm:gap-10">
        <AnimatedSection animation="stampHit" delay={0}>
          <div
            className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-sello text-center text-sello outline outline-1 outline-offset-2 outline-sello/40 sm:size-36"
            style={{ transform: "rotate(-4deg)" }}
          >
            <div className="font-mono text-3xl font-bold sm:text-4xl">
              <AnimatedCounter target={30} />
            </div>
            <div className="mt-1 px-2 text-xs text-muted-foreground">minutos por día</div>
          </div>
        </AnimatedSection>
        <AnimatedSection animation="stampHit" delay={150}>
          <div
            className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-sello text-center text-sello outline outline-1 outline-offset-2 outline-sello/40 sm:size-36"
            style={{ transform: "rotate(3deg)" }}
          >
            <div className="font-mono text-3xl font-bold sm:text-4xl">
              <AnimatedCounter target={15} />
            </div>
            <div className="mt-1 px-2 text-xs text-muted-foreground">horas por mes</div>
          </div>
        </AnimatedSection>
        <AnimatedSection animation="stampHit" delay={300}>
          <div
            className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-sello text-center text-sello outline outline-1 outline-offset-2 outline-sello/40 sm:size-36"
            style={{ transform: "rotate(-2deg)" }}
          >
            <div className="font-mono text-3xl font-bold sm:text-4xl">
              <AnimatedCounter target={180} />
            </div>
            <div className="mt-1 px-2 text-xs text-muted-foreground">horas por año</div>
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection delay={200}>
        <p className="mx-auto mt-10 max-w-lg text-center text-muted-foreground">
          Tiempo que podrías dedicar a{" "}
          <span className="font-semibold text-foreground">atender más clientes</span> o simplemente{" "}
          <span className="font-semibold text-foreground">descansar</span>.
        </p>
      </AnimatedSection>
    </section>
  );
}
