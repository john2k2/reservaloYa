"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { seoLandingPages } from "@/constants/seo-landing-pages";
import { demoBusinessOptions, productName, productTagline, demoBusinessSlug } from "@/constants/site";
import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";

export function Footer() {
  const pathname = usePathname();
  const secondaryHref = pathname === "/precios" ? "/#demos" : "/precios";
  const secondaryLabel = pathname === "/precios" ? "Ver demos en vivo" : "Ver precios";

  return (
    <footer id="contacto" className="relative border-t border-rule bg-background">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mb-16 border-b border-rule pb-16 text-center">
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

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <ReservaYaLogo size="sm" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{productTagline}</p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-ticket">
              Sistema operativo
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Producto</p>
            <div className="mt-6 flex flex-col gap-3">
              {[
                { href: `/${demoBusinessSlug}`, label: "Ejemplo en vivo" },
                { href: "/login", label: "Panel administrador" },
                { href: "/precios", label: "Precios" },
                { href: "/funcionalidades", label: "Beneficios" },
                { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
                { href: "/sobre-reservaya", label: "Sobre ReservaYa" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                  <ArrowUpRight className="size-3 -translate-y-1 translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Demos en vivo
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {demoBusinessOptions.map((demo) => (
                <Link
                  key={demo.slug}
                  href={`/${demo.slug}`}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {demo.label}
                  <ArrowUpRight className="size-3 -translate-y-1 translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Soluciones
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {seoLandingPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {page.title}
                  <ArrowUpRight className="size-3 -translate-y-1 translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground">Contacto</p>
            <div className="mt-6 space-y-4">
              <a
                href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="size-4 shrink-0 text-sello" />
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-xs">{siteContact.whatsappLabel}</p>
                </div>
              </a>
              <a
                href={`mailto:${siteContact.email}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0 text-sello" />
                <span className="font-medium text-foreground">{siteContact.email}</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Horario</p>
                  <p className="text-xs">{siteContact.businessHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-rule pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="/contacto"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contacto
            </Link>
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
