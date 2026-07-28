"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { productName, productTagline } from "@/constants/site";
import { seoLandingPages } from "@/constants/seo-landing-pages";
import { getSiteWhatsAppHref } from "@/lib/contact";

const footerNav = [
  { href: "/precios", label: "Precios" },
  { href: "/#demos", label: "Demos" },
  { href: "/preguntas-frecuentes", label: "FAQ" },
  { href: "/sobre-reservaya", label: "Sobre nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function Footer() {
  const pathname = usePathname();
  const secondaryHref = pathname === "/precios" ? "/#demos" : "/precios";
  const secondaryLabel = pathname === "/precios" ? "Ver demos en vivo" : "Ver precios";

  return (
    <footer id="contacto" className="relative border-t border-rule bg-background">
      {/* A diferencia del resto de la landing (max-w-6xl centrado), el footer va
          a ancho completo: es la banda de cierre de la página y tiene que llegar
          a los bordes. El padding crece con el viewport para que en pantallas
          anchas el contenido no quede pegado al borde. */}
      <div className="relative px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-20">
        <div className="border-b border-rule pb-14 text-center">
          <h3 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            ¿Tenés dudas antes de empezar?
          </h3>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Te respondemos por WhatsApp. Sin bots, sin formularios eternos.
          </p>
          <div className="mt-8 flex w-full flex-col flex-wrap items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <a
              href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground px-8 font-semibold text-background transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/10 sm:w-auto"
            >
              Hablar por WhatsApp
              <ArrowUpRight className="size-4 shrink-0" />
            </a>
            <Link
              href={secondaryHref}
              className="inline-flex h-14 w-full items-center justify-center whitespace-nowrap rounded-full border border-rule px-8 font-medium text-foreground transition-colors duration-300 hover:bg-secondary/50 sm:w-auto"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-end">
          <div className="max-w-sm">
            <ReservaYaLogo size="sm" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{productTagline}</p>
          </div>

          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-3">
            {footerNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav
          aria-label="Por rubro"
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-8"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-sello">
            Por rubro
          </span>
          {seoLandingPages.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {page.eyebrow}
            </Link>
          ))}
        </nav>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-rule pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {productName}
          </p>
          <div className="flex gap-6">
            <Link
              href="/terminos"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Términos
            </Link>
            <Link
              href="/privacidad"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
