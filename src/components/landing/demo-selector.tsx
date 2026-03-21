"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Palette,
} from "lucide-react";

import { demoBusinessOptions } from "@/constants/site";
import { AnimatedSection } from "./animated-section";

const demoHighlights = [
  {
    icon: CalendarDays,
    title: "Reserva publica real",
    description:
      "El cliente elige servicio, día y horario desde el celular sin dar vueltas ni pedir ayuda.",
    badge: "Flujo completo",
  },
  {
    icon: LayoutDashboard,
    title: "Panel admin util",
    description:
      "Agenda, clientes, servicios y disponibilidad ya listos para mostrar el producto en uso real.",
    badge: "Operación diaria",
  },
  {
    icon: Palette,
    title: "Negocio configurable",
    description:
      "Branding, textos y presencia publica para que cada negocio sienta que tiene su propio sistema.",
    badge: "Personalizacion",
  },
];

const demoProofPoints = [
  "Responsive en mobile y desktop",
  "Reprogramación y cancelación desde link",
  "Onboarding listo para nuevos negocios",
];

export function DemoSelector() {
  return (
    <>
      <AnimatedSection delay={400}>
        <div className="mx-auto mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {demoBusinessOptions.map((option, index) => (
            <Link
              key={option.slug}
              href={`/${option.slug}`}
              className="group rounded-2xl border border-border/70 bg-card/80 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-foreground/20 hover:bg-secondary/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
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

      <AnimatedSection delay={600} animation="fadeInScale">
        <div className="mx-auto mt-16 w-full max-w-5xl">
          <div className="rounded-[2rem] border border-border/60 bg-card/85 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Lo que vas a ver
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Ejemplos en vivo pensados para mostrar el producto en uso real.
                </h3>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Preferimos mostrar el flujo real y lo que ya resuelve hoy, en lugar de depender de
                capturas que no suman contexto.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {demoHighlights.map(({ icon: Icon, title, description, badge }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border/60 bg-background/85 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {badge}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-foreground">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {demoProofPoints.map((item) => (
                <div
                  key={item}
                  className="flex min-h-11 items-center gap-3 rounded-2xl border border-border/50 bg-background/70 px-4 py-3 text-sm text-foreground"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-foreground" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
