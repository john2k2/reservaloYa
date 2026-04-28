import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";

const pricingItems = [
  { text: "Landing pública profesional del negocio", highlight: false },
  { text: "Reserva online con horarios en tiempo real", highlight: true },
  { text: "Panel admin con agenda y clientes", highlight: false },
  { text: "Recordatorios automáticos por email", highlight: true },
  { text: "Soporte técnico incluido", highlight: false },
];

type PricingSectionProps = {
  arsPrice: number;
};

export function PricingSection({ arsPrice }: PricingSectionProps) {
  const arsPriceLabel = arsPrice.toLocaleString("es-AR");

  return (
    <section
      id="precios"
      className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <AnimatedSection>
        <div className="flex flex-col items-center text-center relative">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">
            Precios
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            Un plan. Sin permanencia.
          </h2>
          <p className="mt-6 max-w-[500px] text-lg text-muted-foreground">
            Arrancás gratis con 15 días de trial. Después abonás al tipo de cambio blue.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={200} animation="fadeInScale">
        <div className="mt-12 sm:mt-16 flex justify-center px-2 sm:px-0">
          <div className="relative w-full max-w-lg">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-[2rem] blur-xl opacity-60" />
            
            <div className="relative rounded-[2rem] border border-border/60 bg-card/80 backdrop-blur-sm p-8 sm:p-10 md:p-12 shadow-2xl">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background shadow-xl">
                  <Zap className="w-4 h-4" />
                  Plan único
                </div>
              </div>

              {/* Price */}
              <div className="text-center mt-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mensualidad</p>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-6xl sm:text-7xl font-bold tracking-tighter font-display">${arsPriceLabel}</span>
                  <span className="ml-2 text-xl text-muted-foreground">ARS/mes</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Precio en pesos al dólar blue del día
                </p>
              </div>

              {/* Trial badge */}
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  15 días gratis para probar
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 space-y-4">
                {pricingItems.map((item, index) => (
                  <div
                    key={item.text}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
                      item.highlight && "bg-primary/5 border border-primary/10",
                      !item.highlight && "border border-transparent hover:border-border/60"
                    )}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5",
                      item.highlight ? "bg-primary/20" : "bg-green-100"
                    )}>
                      <CheckCircle2 className={cn(
                        "w-4 h-4",
                        item.highlight ? "text-primary" : "text-green-600"
                      )} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 space-y-4">
                <Link
                  href="/admin/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "group h-14 w-full rounded-full font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  )}
                >
                  Comenzar mis 15 días gratis
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="text-center text-sm text-muted-foreground">
                  Sin tarjeta de crédito. Sin compromiso. Cancelás cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
