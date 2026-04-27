import {
  LandingHeader,
  HeroSection,
  DemoSelector,
  HowItWorksSection,
  BeforeAfterSection,
  TargetAudienceSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  CTASection,
  Footer,
} from "@/components/landing";
import Link from "next/link";
import { seoLandingPages } from "@/constants/seo-landing-pages";
import { landingSeoFaqs } from "@/constants/site";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createPageMetadata } from "@/lib/seo/metadata";
import { FAQPageJsonLd, SoftwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { getSubscriptionArsPrice } from "@/server/payments-domain";

import "./landing-animations.css";

export const metadata = createPageMetadata({
  title: "Sistema de turnos online para barberías, peluquerías y estética",
  description:
    "ReservaYa automatiza reservas, agenda online, clientes y recordatorios para negocios de servicios en Argentina y Latinoamérica.",
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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Soluciones por rubro
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            Sistema de reservas online para negocios de servicios en Argentina y LatAm
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            ReservaYa está pensado para equipos chicos que necesitan ordenar turnos, disponibilidad,
            clientes y recordatorios sin sumar complejidad operativa.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {seoLandingPages.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-1 hover:border-foreground/30 hover:shadow-sm"
            >
              <h3 className="font-semibold text-foreground group-hover:underline">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-background selection:bg-foreground selection:text-background"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 subtle-grid opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />

      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-gradient-to-bl from-gray-200/40 to-transparent blur-3xl animate-float delay-500" />

      <LandingHeader />

      <SoftwareApplicationJsonLd />
      <FAQPageJsonLd faqs={landingSeoFaqs} />

      <HeroSection />
      <BeforeAfterSection />
      <TargetAudienceSection />
      <VerticalSeoLinksSection />
      <FeaturesSection />
      <DemoSelector />
      <HowItWorksSection />
      <PricingSection arsPrice={arsPrice} />
      <FAQSection />
      <CTASection />

      <Footer />
    </main>
  );
}
