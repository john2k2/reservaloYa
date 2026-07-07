import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Footer, LandingHeader } from "@/components/landing";
import { buttonVariants } from "@/components/ui/button-variants";
import type { SeoLandingPage } from "@/constants/seo-landing-pages";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function VerticalSeoPage({ page }: { page: SeoLandingPage }) {
  return (
    <main id="main-content" className="landing-theme min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 pt-32 sm:px-6 sm:py-18 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24 lg:pt-40">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {page.eyebrow}
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
            <Link href="/admin/signup" className={cn(buttonVariants({ variant: "default", size: "lg" }), "whitespace-nowrap rounded-full font-semibold")}>
              Probar ReservaYa
              <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
            <a
              href={getSiteWhatsAppHref(`Hola, quiero consultar por ${page.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "whitespace-nowrap rounded-full font-semibold")}
            >
              Pedir una demo
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-rule bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Qué podés ordenar desde el primer día</h2>
          <ul className="mt-6 space-y-4">
            {page.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sello" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-y border-rule bg-secondary/20">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Para quién es</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Una agenda online simple para negocios reales</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{page.audience}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Casos de uso</p>
            <ul className="mt-4 divide-y divide-rule border-t border-rule">
              {page.useCases.map((useCase) => (
                <li key={useCase} className="py-3 text-sm text-muted-foreground">
                  {useCase}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Preguntas frecuentes</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Dudas comunes antes de digitalizar los turnos</h2>
        </div>
        <div className="mt-8 divide-y divide-rule border-y border-rule">
          {page.faqs.map((faq) => (
            <article key={faq.question} className="py-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
