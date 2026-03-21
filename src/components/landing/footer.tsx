"use client";

import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { productName, demoBusinessSlug } from "@/constants/site";
import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border/40 bg-gradient-to-b from-secondary/20 to-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand */}
          <div>
            <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-foreground">
              {productName}
            </span>
            <p className="mt-2 sm:mt-3 text-sm text-muted-foreground">
              Página de reservas + Agenda + Recordatorios para barberías y estéticas.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-semibold text-foreground text-sm sm:text-base">Links</p>
            <div className="mt-3 sm:mt-4 flex flex-col gap-2">
              <Link
                href={`/${demoBusinessSlug}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1 inline-flex min-h-8 items-center"
              >
                Ejemplo en vivo
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1 inline-flex min-h-8 items-center"
              >
                Panel administrador
              </Link>
              <a
                href="#precios"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1 inline-flex min-h-8 items-center"
              >
                Precios
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 md:col-span-1">
            <p className="font-semibold text-foreground text-sm sm:text-base">Contacto</p>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <a
                href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1 min-h-8"
              >
                <Phone className="size-4" />
                {siteContact.whatsappLabel}
              </a>
              <a
                href={`mailto:${siteContact.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1 min-h-8"
              >
                <Mail className="size-4" />
                {siteContact.email}
              </a>
              <p className="flex items-center gap-2 text-sm text-muted-foreground min-h-8">
                <Clock className="size-4" />
                {siteContact.businessHours}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:pt-8 sm:flex-row">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link href="/terminos" className="transition-colors hover:text-foreground min-h-8 inline-flex items-center">
              Términos
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-foreground min-h-8 inline-flex items-center">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
