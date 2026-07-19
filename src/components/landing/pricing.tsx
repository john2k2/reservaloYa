import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { SUBSCRIPTION_CARD_USD_PRICE, SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";
import { AnimatedSection } from "./animated-section";
import { SelloStamp } from "./sello-stamp";

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
      className="relative mx-auto w-full max-w-6xl border-t border-rule px-4 py-16 sm:px-6 sm:py-20 lg:py-28"
    >
      <AnimatedSection>
        <div className="flex flex-col items-center text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-sello">Precios</p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            Un plan. Sin permanencia.
          </h2>
          <p className="mt-6 max-w-[500px] text-lg text-muted-foreground">
            Arrancás gratis con 15 días de trial. Después, precio promo por transferencia en pesos
            o tarjeta en USD.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={160} animation="fadeInScale">
        <div className="mt-12 flex justify-center sm:mt-16">
          <div className="relative w-full max-w-lg border border-rule bg-card px-6 py-10 sm:px-10 sm:py-12">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <SelloStamp label="Plan único" sublabel="Sin permanencia" rotate={-8} className="bg-card" />
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Mensualidad
              </p>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="font-mono text-6xl font-bold tracking-tighter sm:text-7xl">
                  ${arsPriceLabel}
                </span>
                <span className="ml-2 text-xl text-muted-foreground">ARS/mes</span>
              </div>
            </div>

            <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-ticket">
              15 días gratis · Promo transferencia ≈ USD {SUBSCRIPTION_USD_PRICE}
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Tarjeta: USD {SUBSCRIPTION_CARD_USD_PRICE}/mes
            </p>

            <ul className="mt-8 space-y-0 border-y border-rule">
              {pricingItems.map((item) => (
                <li
                  key={item.text}
                  className={cn(
                    "flex items-start gap-3 border-b border-rule py-3 last:border-b-0",
                    item.highlight && "bg-sello/5"
                  )}
                >
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      item.highlight ? "text-sello" : "text-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3">
              <Link
                href="/admin/signup"
                className={cn(
                  "group inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 text-base",
                  "bg-foreground font-semibold text-background",
                  "transition-[transform,box-shadow] duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/10 active:scale-[0.98]"
                )}
              >
                Empezar el trial gratis
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                Sin compromiso. Cancelás cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
