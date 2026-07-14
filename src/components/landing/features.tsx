"use client";

import { AnimatedSection } from "./animated-section";
import { SectionTitle } from "@/components/layout/section-title";

const features = [
  {
    number: "01",
    title: "Disponibilidad 24/7",
    description:
      "Tus reservas quedan siempre abiertas, incluso cuando estás ocupado o el local cerrado.",
  },
  {
    number: "02",
    title: "Menos mensajes",
    description:
      "Eliminá el ida y vuelta de preguntas sobre horarios o precios por WhatsApp.",
  },
  {
    number: "03",
    title: "Fácil de usar",
    description:
      "Interfaz clara para tus clientes al reservar y para vos al administrar la agenda.",
  },
  {
    number: "04",
    title: "Recordatorios automáticos",
    description: "Emails automáticos 24 hs antes del turno. Menos ausencias, mejor ocupación.",
  },
  {
    number: "05",
    title: "Base de clientes",
    description: "Historial de cada cliente, preferencias y reservas anteriores.",
  },
  {
    number: "06",
    title: "100% responsive",
    description: "Tus clientes reservan desde cualquier dispositivo sin descargar apps.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
      <AnimatedSection>
        <SectionTitle
          eyebrow="Beneficios"
          title="Todo lo que necesitás, nada que no."
          description="Características pensadas para resolver problemas reales de negocios como el tuyo."
        />
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <div className="mt-12 divide-y divide-rule border-y border-rule sm:mt-16">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="grid gap-3 py-6 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-7"
            >
              <span className="font-mono text-sm font-semibold tracking-wider text-sello">
                {feature.number}
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
