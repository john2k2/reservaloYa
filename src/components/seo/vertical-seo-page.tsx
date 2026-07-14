import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Footer, LandingHeader } from "@/components/landing";
import { buttonVariants } from "@/components/ui/button-variants";
import type { SeoLandingPage } from "@/constants/seo-landing-pages";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { getLandingHeaderSession } from "@/server/landing-session";

export async function VerticalSeoPage({ page }: { page: SeoLandingPage }) {
  const session = await getLandingHeaderSession();

  return (
    <main id="main-content" className="landing-theme min-h-screen bg-background text-foreground">
      <LandingHeader session={session} />

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 pt-32 sm:px-6 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-40">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {page.eyebrow}
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{page.intro}</p>
          <div className="mt-8 flex w-full flex-col flex-wrap gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/admin/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "whitespace-nowrap rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
              )}
            >
              Probar 15 días gratis
              <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
            <a
              href={getSiteWhatsAppHref(`Hola, quiero consultar por ${page.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "whitespace-nowrap rounded-full border-rule font-semibold"
              )}
            >
              Hablar por WhatsApp
            </a>
          </div>
        </div>

        <aside>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Qué podés ordenar desde el primer día
          </h2>
          <ul className="mt-6 divide-y divide-rule border-y border-rule">
            {page.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 py-3.5 text-sm leading-6 text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-sello" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-y border-rule">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Para quién es
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              Una agenda online simple para negocios reales
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">{page.audience}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Casos de uso
            </p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            Dudas comunes antes de digitalizar los turnos
          </h2>
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
