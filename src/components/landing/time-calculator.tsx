"use client";

import { Clock } from "lucide-react";
import { AnimatedSection } from "./animated-section";
import { AnimatedCounter } from "./animated-counter";

export function TimeCalculatorSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
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

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-background/15 hover:scale-105">
                <div className="text-4xl font-bold">
                  <AnimatedCounter target={30} />
                </div>
                <div className="mt-1 text-sm text-background/60">minutos por día</div>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-background/15 hover:scale-105">
                <div className="text-4xl font-bold">
                  <AnimatedCounter target={15} />
                </div>
                <div className="mt-1 text-sm text-background/60">horas por mes</div>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-background/15 hover:scale-105">
                <div className="text-4xl font-bold">
                  <AnimatedCounter target={180} />
                </div>
                <div className="mt-1 text-sm text-background/60">horas por año</div>
              </div>
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
