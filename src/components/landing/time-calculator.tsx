"use client";

import { Clock } from "lucide-react";
import { AnimatedSection } from "./animated-section";
import { AnimatedCounter } from "./animated-counter";

export function TimeCalculatorSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-rule px-6 py-16 sm:py-20 lg:py-24">
      <AnimatedSection animation="fadeInScale">
        <div className="rounded-3xl bg-gradient-to-br from-foreground via-foreground to-gray-800 p-8 text-background sm:p-12 md:p-16 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-background blur-3xl animate-float" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-background blur-3xl animate-float delay-500" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <Clock className="mx-auto size-10 animate-pulse-subtle" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Cuánto tiempo perdés respondiendo mensajes?
            </h2>
            <p className="mt-4 text-lg text-background/70">
              Si respondés <span className="font-semibold text-background">10 mensajes</span> de turnos por día...
            </p>

            <div className="mt-10 flex flex-wrap items-start justify-center gap-6 sm:gap-8">
              <AnimatedSection animation="stampHit" delay={0}>
                <div
                  className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-background/70 text-center outline outline-1 outline-offset-2 outline-background/25 sm:size-36"
                  style={{ transform: "rotate(-4deg)" }}
                >
                  <div className="font-mono text-3xl font-bold sm:text-4xl">
                    <AnimatedCounter target={30} />
                  </div>
                  <div className="mt-1 px-2 text-xs text-background/60">minutos por día</div>
                </div>
              </AnimatedSection>
              <AnimatedSection animation="stampHit" delay={150}>
                <div
                  className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-background/70 text-center outline outline-1 outline-offset-2 outline-background/25 sm:size-36"
                  style={{ transform: "rotate(3deg)" }}
                >
                  <div className="font-mono text-3xl font-bold sm:text-4xl">
                    <AnimatedCounter target={15} />
                  </div>
                  <div className="mt-1 px-2 text-xs text-background/60">horas por mes</div>
                </div>
              </AnimatedSection>
              <AnimatedSection animation="stampHit" delay={300}>
                <div
                  className="flex size-32 flex-col items-center justify-center rounded-full border-[3px] border-background/70 text-center outline outline-1 outline-offset-2 outline-background/25 sm:size-36"
                  style={{ transform: "rotate(-2deg)" }}
                >
                  <div className="font-mono text-3xl font-bold sm:text-4xl">
                    <AnimatedCounter target={180} />
                  </div>
                  <div className="mt-1 px-2 text-xs text-background/60">horas por año</div>
                </div>
              </AnimatedSection>
            </div>

            <p className="mt-8 text-background/70">
              Tiempo que podrías dedicar a{" "}
              <span className="font-semibold text-background">atender más clientes</span> o simplemente{" "}
              <span className="font-semibold text-background">descansar</span>.
            </p>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
