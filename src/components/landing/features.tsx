"use client";

import { Clock3, MessageCircle, ShieldCheck, Bell, Users, Smartphone } from "lucide-react";
import { SectionTitle } from "@/components/layout/section-title";
import { AnimatedSection } from "./animated-section";

const features = [
  {
    icon: Clock3,
    title: "Disponibilidad 24/7",
    description: "Tus reservas quedan siempre abiertas, incluso cuando tú estás ocupado o el local cerrado.",
  },
  {
    icon: MessageCircle,
    title: "Menos mensajes",
    description: "Elimina el interminable ida y vuelta de preguntas sobre horarios o precios por WhatsApp.",
  },
  {
    icon: ShieldCheck,
    title: "Fácil de usar",
    description: "Interfaz instintiva tanto para tus clientes al reservar, como para ti al administrar.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Emails automáticos 24hs antes del turno. Menos ausencias, mejor ocupación.",
  },
  {
    icon: Users,
    title: "Base de clientes",
    description: "Historial completo de cada cliente, preferencias y reservas anteriores.",
  },
  {
    icon: Smartphone,
    title: "100% responsive",
    description: "Tus clientes reservan desde cualquier dispositivo sin descargar apps.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-border/40 px-6 py-24 md:py-32">
      <AnimatedSection>
        <SectionTitle
          eyebrow="Beneficios"
          title="Todo lo que necesitás, nada que no."
          description="Características pensadas para resolver problemas reales de negocios como el tuyo."
        />
      </AnimatedSection>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <AnimatedSection key={feature.title} delay={index * 100}>
            <article className="group flex flex-col items-start">
              <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-secondary/30 transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:scale-110">
                <feature.icon className="size-5 text-foreground group-hover:text-background" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
            </article>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
