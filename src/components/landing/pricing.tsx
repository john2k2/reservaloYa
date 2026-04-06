import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";
import { AnimatedSection } from "./animated-section";

const pricingItems = [
  "Landing pública profesional del negocio",
  "Reserva online con horarios en tiempo real",
  "Panel admin con agenda y clientes",
  "Recordatorios automáticos por email",
  "Soporte técnico incluido",
];

type PricingSectionProps = {
  arsPrice: number;
};

export function PricingSection({ arsPrice }: PricingSectionProps) {
  const arsPriceLabel = arsPrice.toLocaleString("es-AR");

  return (
    <section
      id="precios"
      className="mx-auto w-full max-w-6xl border-t border-border/40 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-32"
    >
      <AnimatedSection>
        <div className="flex flex-col items-center text-center">
          <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Precios
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            Un plan. Sin permanencia.
          </h2>
          <p className="mt-3 sm:mt-4 max-w-[600px] text-base sm:text-lg text-muted-foreground">
            Arrancás gratis con 15 días de trial. Después abonás ${SUBSCRIPTION_USD_PRICE} USD/mes en pesos al tipo de cambio blue.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={200} animation="fadeInScale">
        <div className="mt-8 sm:mt-12 flex justify-center px-2 sm:px-0">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-b from-background to-secondary/20 p-6 sm:p-8 shadow-lg md:p-10 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-foreground to-gray-700 px-3 sm:px-4 py-1 text-xs font-bold uppercase tracking-wide text-background shadow-lg">
              Plan único
            </div>

            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Mensualidad</p>
              <div className="mt-3 sm:mt-4 flex items-baseline text-4xl sm:text-5xl font-bold tracking-tighter">
                ${arsPriceLabel}
                <span className="ml-2 text-base sm:text-lg font-medium tracking-normal text-muted-foreground">
                  ARS/mes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Precio en pesos al dólar blue del día
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center rounded-full bg-green-100 px-2.5 sm:px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                15 días gratis para probar
              </div>
            </div>

            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              {pricingItems.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-2 sm:gap-3 transition-all duration-200 hover:translate-x-1"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <CheckCircle2 className="mt-0.5 size-4 sm:size-5 shrink-0 text-green-600" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 space-y-3">
              <Link
                href="/admin/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 sm:h-12 w-full rounded-full font-semibold transition-all duration-200 hover:scale-105"
                )}
              >
                Comenzar mis 15 días gratis
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                Sin tarjeta de crédito. Sin compromiso. Cancelás cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
