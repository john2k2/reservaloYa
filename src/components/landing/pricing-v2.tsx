"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

const plans = [
  {
    name: "Esencial",
    description: "Para profesionales que recién empiezan",
    price: 15,
    priceLabel: "$15",
    period: "USD/mes",
    icon: Zap,
    popular: false,
    features: [
      { text: "Landing pública profesional", included: true },
      { text: "Reserva online 24/7", included: true },
      { text: "Panel admin básico", included: true },
      { text: "Hasta 3 servicios", included: true },
      { text: "Recordatorios por email", included: true },
      { text: "Soporte por WhatsApp (48hs)", included: true },
      { text: "1 usuario admin", included: true },
      { text: "Hasta 100 reservas/mes", included: true },
      { text: "Recordatorios por WhatsApp", included: false },
      { text: "Exportación de datos", included: false },
      { text: "Pagos online integrados", included: false },
    ],
    cta: "Empezar gratis",
    ctaVariant: "outline" as const,
  },
  {
    name: "Profesional",
    description: "Para negocios que quieren crecer",
    price: 24,
    priceLabel: "$24",
    period: "USD/mes",
    icon: Users,
    popular: true,
    features: [
      { text: "Todo lo del plan Esencial", included: true, highlight: true },
      { text: "Servicios ilimitados", included: true },
      { text: "Recordatorios por WhatsApp + Email", included: true },
      { text: "Base de clientes completa", included: true },
      { text: "Reseñas y calificaciones", included: true },
      { text: "Exportación de datos", included: true },
      { text: "Soporte prioritario (24hs)", included: true },
      { text: "Hasta 3 usuarios/staff", included: true },
      { text: "Hasta 500 reservas/mes", included: true },
      { text: "Múltiples ubicaciones (2)", included: true },
      { text: "Pagos online integrados", included: false },
    ],
    cta: "Empezar gratis",
    ctaVariant: "default" as const,
    badge: "Más popular",
  },
  {
    name: "Premium",
    description: "Para cadenas y negocios en crecimiento",
    price: 39,
    priceLabel: "$39",
    period: "USD/mes",
    icon: Crown,
    popular: false,
    features: [
      { text: "Todo lo del plan Profesional", included: true, highlight: true },
      { text: "Pagos online (MercadoPago)", included: true },
      { text: "Confirmaciones por SMS", included: true },
      { text: "Reportes y analytics avanzados", included: true },
      { text: "Marketing automation", included: true },
      { text: "Integración Google Calendar", included: true },
      { text: "Usuarios ilimitados", included: true },
      { text: "Reservas ilimitadas", included: true },
      { text: "Ubicaciones ilimitadas", included: true },
      { text: "Soporte VIP (4hs)", included: true },
      { text: "Onboarding personalizado", included: true },
    ],
    cta: "Contactar ventas",
    ctaVariant: "outline" as const,
  },
];

export function PricingSectionV2() {
  return (
    <section
      id="precios"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <AnimatedSection>
        <div className="flex flex-col items-center text-center relative">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">
            Planes y precios
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            Elegí el plan perfecto para tu negocio
          </h2>
          <p className="mt-6 max-w-[600px] text-lg text-muted-foreground">
            Todos los planes incluyen 15 días de prueba gratis. Sin tarjeta, sin compromiso.
          </p>
        </div>
      </AnimatedSection>

      <div className="mt-16 grid gap-8 lg:grid-cols-3 items-start">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <AnimatedSection key={plan.name} delay={index * 150}>
              <div
                className={cn(
                  "relative rounded-3xl border p-8 transition-all duration-500",
                  plan.popular
                    ? "border-primary/30 bg-card/80 shadow-2xl shadow-primary/5 scale-105 lg:scale-110"
                    : "border-border/60 bg-card/50 hover:border-primary/20 hover:shadow-xl"
                )}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg">
                      <Zap className="w-3.5 h-3.5" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center">
                  <div className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4",
                    plan.popular ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      plan.popular ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  
                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold tracking-tighter font-display">{plan.priceLabel}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <p className="mt-2 text-xs text-muted-foreground">
                    Aproximadamente ${(plan.price * 1400).toLocaleString('es-AR')} ARS/mes
                  </p>
                </div>

                {/* Features */}
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature.text}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        !feature.included && "opacity-40"
                      )}
                    >
                      <CheckCircle2 className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        feature.included 
                          ? feature.highlight 
                            ? "text-primary" 
                            : "text-green-500"
                          : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        feature.highlight && "font-medium text-foreground"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <Link
                    href="/admin/signup"
                    className={cn(
                      "group flex h-14 w-full items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300",
                      plan.popular
                        ? "bg-foreground text-background hover:scale-[1.02] hover:shadow-xl"
                        : "border border-border/80 hover:bg-secondary/50 hover:border-foreground/20"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>

      {/* Trust note */}
      <AnimatedSection delay={500}>
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Todos los planes incluyen soporte por WhatsApp y actualizaciones automáticas.
          </p>
        </div>
      </AnimatedSection>
    </section>
  );
}