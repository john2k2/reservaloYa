"use client";

import { useRef, useState, useEffect } from "react";
import { SectionTitle } from "@/components/layout/section-title";
import { AnimatedSection } from "./animated-section";
import { cn } from "@/lib/utils";

const features = [
  {
    number: "01",
    title: "Disponibilidad 24/7",
    description: "Tus reservas quedan siempre abiertas, incluso cuando tú estás ocupado o el local cerrado.",
    accent: "from-amber-500/10 to-orange-500/5",
    numberColor: "text-amber-500/30",
  },
  {
    number: "02",
    title: "Menos mensajes",
    description: "Elimina el interminable ida y vuelta de preguntas sobre horarios o precios por WhatsApp.",
    accent: "from-blue-500/10 to-cyan-500/5",
    numberColor: "text-blue-500/30",
  },
  {
    number: "03",
    title: "Fácil de usar",
    description: "Interfaz instintiva tanto para tus clientes al reservar, como para ti al administrar.",
    accent: "from-emerald-500/10 to-teal-500/5",
    numberColor: "text-emerald-500/30",
  },
  {
    number: "04",
    title: "Recordatorios automáticos",
    description: "Emails automáticos 24hs antes del turno. Menos ausencias, mejor ocupación.",
    accent: "from-purple-500/10 to-pink-500/5",
    numberColor: "text-purple-500/30",
  },
  {
    number: "05",
    title: "Base de clientes",
    description: "Historial completo de cada cliente, preferencias y reservas anteriores.",
    accent: "from-rose-500/10 to-red-500/5",
    numberColor: "text-rose-500/30",
  },
  {
    number: "06",
    title: "100% responsive",
    description: "Tus clientes reservan desde cualquier dispositivo sin descargar apps.",
    accent: "from-indigo-500/10 to-violet-500/5",
    numberColor: "text-indigo-500/30",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatedSection delay={index * 100}>
      <article 
        className="group relative flex flex-col items-start p-8 rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background gradient on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
          feature.accent,
          isHovered && "opacity-100"
        )} />
        
        {/* Large number background */}
        <span className={cn(
          "absolute -right-4 -top-8 font-display text-[120px] font-bold leading-none transition-all duration-500 select-none",
          feature.numberColor,
          isHovered && "scale-110 -translate-y-2"
        )}>
          {feature.number}
        </span>
        
        {/* Content */}
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            {feature.number}
          </span>
          
          <h3 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-foreground transition-colors">
            {feature.title}
          </h3>
          
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
          
          {/* Animated line */}
          <div className="mt-6 h-px w-12 bg-border group-hover:w-full group-hover:bg-primary/30 transition-all duration-500" />
        </div>
      </article>
    </AnimatedSection>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <AnimatedSection>
        <SectionTitle
          eyebrow="Beneficios"
          title="Todo lo que necesitás, nada que no."
          description="Características pensadas para resolver problemas reales de negocios como el tuyo."
        />
      </AnimatedSection>

      <div className="mt-16 sm:mt-20 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
