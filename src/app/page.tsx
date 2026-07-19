import {
  LandingPageShell,
  HeroSection,
  DemoSelector,
  TimeCalculatorSection,
  PricingSection,
} from "@/components/landing";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { seoLandingPages } from "@/constants/seo-landing-pages";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SoftwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { getSubscriptionArsPrice } from "@/server/payments-domain";

export const metadata = createPageMetadata({
  title: "Sistema de turnos online para barberías y estética",
  description:
    "Sistema de turnos online para barberías, peluquerías y estética en Argentina. Automatizá reservas, agenda, clientes y recordatorios con ReservaYa.",
  path: "/",
  keywords: [
    "sistema de turnos online",
    "reservas online",
    "agenda online",
    "software para barberías",
    "software para peluquerías",
    "sistema reservas centros de estética",
  ],
});

function VerticalSeoLinksSection() {
  return (
    <section className="mx-auto w-full max-w-6xl border-t border-rule px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Soluciones por rubro
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Sistema de reservas online para negocios de servicios
        </h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Pensado para equipos chicos que necesitan ordenar turnos, disponibilidad, clientes y
          recordatorios sin sumar complejidad operativa.
        </p>
      </div>
      <div className="mt-8 divide-y divide-rule border-y border-rule">
        {seoLandingPages.map((page) => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className="group flex items-center justify-between gap-4 py-5 transition-colors hover:text-sello focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-sello group-hover:underline">
                {page.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{page.description}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-sello" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  return (
    <LandingPageShell>
      <SoftwareApplicationJsonLd />

      <HeroSection />
      <DemoSelector />
      <TimeCalculatorSection />
      <PricingSection arsPrice={arsPrice} />
      <VerticalSeoLinksSection />
    </LandingPageShell>
  );
}
