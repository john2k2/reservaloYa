import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { Footer } from "@/components/landing";
import { buttonVariants } from "@/components/ui/button-variants";
import type { SeoLandingPage } from "@/constants/seo-landing-pages";
import { demoBusinessSlug } from "@/constants/site";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function VerticalSeoPage({ page }: { page: SeoLandingPage }) {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Ir al inicio de ReservaYa">
            <ReservaYaLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${demoBusinessSlug}`} className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Ver demo
            </Link>
            <Link href="/admin/signup" className={cn(buttonVariants({ variant: "default", size: "sm" }), "font-semibold")}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {page.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/signup" className={cn(buttonVariants({ variant: "default", size: "lg" }), "rounded-full font-semibold")}>
              Probar ReservaYa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={getSiteWhatsAppHref(`Hola, quiero consultar por ${page.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full font-semibold")}
            >
              Pedir una demo
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Qué podés ordenar desde el primer día</h2>
          <ul className="mt-6 space-y-4">
            {page.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-y border-border/40 bg-secondary/20">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Para quién es</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Una agenda online simple para negocios reales</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{page.audience}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Casos de uso</p>
            <ul className="mt-4 space-y-3">
              {page.useCases.map((useCase) => (
                <li key={useCase} className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
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
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Dudas comunes antes de digitalizar los turnos</h2>
        </div>
        <div className="mt-8 grid gap-4">
          {page.faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-foreground p-8 text-background sm:p-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">¿Querés ver si ReservaYa encaja con tu negocio?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-background/75">
              Probá el flujo de reserva, revisá la demo y hablá con nosotros si necesitás validar tu caso antes de empezar.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link href={`/${demoBusinessSlug}`} className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90">
              Ver ejemplo en vivo
            </Link>
            <Link href="/admin/signup" className="inline-flex h-11 items-center justify-center rounded-full border border-background/40 px-5 text-sm font-semibold text-background transition-colors hover:bg-background/10">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
