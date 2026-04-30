"use client";

import Link from "next/link";
import { Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { seoLandingPages } from "@/constants/seo-landing-pages";
import { demoBusinessOptions, productName, productTagline, demoBusinessSlug } from "@/constants/site";
import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer id="contacto" className="relative border-t border-border/40 bg-gradient-to-b from-secondary/30 via-background to-background overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        {/* Top section with CTA */}
        <div className="text-center mb-16 pb-16 border-b border-border/40"
        >
          <h3 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
            ¿Listo para ordenar tu negocio?
          </h3>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
            Empezá gratis hoy. Sin tarjeta, sin compromiso.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/signup"
              className={cn(
                "inline-flex items-center gap-2 h-14 px-8 rounded-full",
                "bg-foreground text-background font-semibold",
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              )}
            >
              Crear cuenta gratis
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a
              href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full border border-border/80 font-medium transition-all duration-300 hover:bg-secondary/50"
            >
              Hablar por WhatsApp
            </a>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Brand */}
          <div className="lg:col-span-1"
          >
            <ReservaYaLogo size="sm" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {productTagline}
            </p>
            <div className="mt-6 flex items-center gap-2"
            >
              <span className="relative flex h-2.5 w-2.5"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"
                ></span>
              </span>
              <span className="text-xs text-muted-foreground">Sistema operativo</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider"
            >Producto</p>
            <div className="mt-6 flex flex-col gap-3"
            >
              {[
                { href: `/${demoBusinessSlug}`, label: "Ejemplo en vivo" },
                { href: "/login", label: "Panel administrador" },
                { href: "#precios", label: "Precios" },
                { href: "#beneficios", label: "Beneficios" },
                { href: "/sobre-reservaya", label: "Sobre ReservaYa" },
                { href: "/about", label: "About ReservaYa" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider"
            >Demos en vivo</p>
            <div className="mt-6 flex flex-col gap-3"
            >
              {demoBusinessOptions.map((demo) => (
                <Link
                  key={demo.slug}
                  href={`/${demo.slug}`}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {demo.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider"
            >Soluciones</p>
            <div className="mt-6 flex flex-col gap-3"
            >
              {seoLandingPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {page.title}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-semibold text-foreground text-sm uppercase tracking-wider"
            >Contacto</p>
            <div className="mt-6 space-y-4"
            >
              <a
                href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
                >
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-xs">{siteContact.whatsappLabel}</p>
                </div>
              </a>
              <a
                href={`mailto:${siteContact.email}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
                >
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{siteContact.email}</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Horario</p>
                  <p className="text-xs">{siteContact.businessHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground"
          >
            © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6"
          >
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
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
