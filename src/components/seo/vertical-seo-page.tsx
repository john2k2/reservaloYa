import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Footer, LandingHeader } from "@/components/landing";
import { buttonVariants } from "@/components/ui/button-variants";
import { seoLandingPages, type SeoLandingPage } from "@/constants/seo-landing-pages";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { BreadcrumbJsonLd } from "@/lib/seo/business-json-ld";
import { FAQPageJsonLd, SoftwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import { getLandingHeaderSession } from "@/server/landing-session";

export async function VerticalSeoPage({ page }: { page: SeoLandingPage }) {
  const session = await getLandingHeaderSession();
  const pageUrl = `${siteConfig.url}/${page.slug}`;
  const demoHref = page.demoSlug ? `/${page.demoSlug}` : "/funcionalidades";
  const relatedPages = seoLandingPages.filter((relatedPage) => relatedPage.slug !== page.slug);

  return (
    <main id="main-content" className="landing-theme min-h-screen bg-background text-foreground">
      <SoftwareApplicationJsonLd
        name={`${siteConfig.name} - ${page.title}`}
        description={page.description}
        url={pageUrl}
      />
      <FAQPageJsonLd faqs={page.faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: siteConfig.url },
          { name: page.title, url: pageUrl },
        ]}
      />

      <LandingHeader session={session} />

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 pt-32 sm:px-6 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-40">
        <div>
          <nav aria-label="Migas de pan" className="mb-4 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-foreground hover:underline">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{page.eyebrow}</li>
            </ol>
          </nav>
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
            <Link
              href={demoHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "whitespace-nowrap rounded-full border-rule font-semibold"
              )}
            >
              {page.demoLabel}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            También podés{" "}
            <Link href="/precios" className="font-medium text-foreground underline underline-offset-4">
              ver precios
            </Link>{" "}
            o{" "}
            <a
              href={getSiteWhatsAppHref(`Hola, quiero consultar por ${page.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              escribir por WhatsApp
            </a>
            .
          </p>
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

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Cómo funciona en tu rubro
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight">
          Del catálogo al turno confirmado, sin inventar procesos raros
        </h2>
        <ol className="mt-8 divide-y divide-rule border-y border-rule">
          {page.howItWorks.map((step, index) => (
            <li key={step} className="flex gap-4 py-4 text-sm leading-6 text-muted-foreground">
              <span className="font-mono text-xs font-semibold text-sello">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={demoHref}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
            )}
          >
            {page.demoLabel}
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
          <Link
            href="/precios"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full border-rule font-semibold"
            )}
          >
            Ver precios
          </Link>
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

      <section className="mx-auto w-full max-w-6xl border-t border-rule px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Soluciones relacionadas
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight">
          Sistemas de turnos para otros negocios de servicios
        </h2>
        <div className="mt-8 divide-y divide-rule border-y border-rule">
          {relatedPages.map((relatedPage) => (
            <Link
              key={relatedPage.slug}
              href={`/${relatedPage.slug}`}
              className="group flex items-center justify-between gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-sello group-hover:underline">
                  {relatedPage.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {relatedPage.description}
                </p>
              </div>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-sello"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
