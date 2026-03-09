"use client";

import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { productName, demoBusinessSlug } from "@/constants/site";

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border/40 bg-gradient-to-b from-secondary/20 to-background">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">
              {productName}
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Página de reservas + Agenda + Recordatorios para barberías y estéticas.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-semibold text-foreground">Links</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/${demoBusinessSlug}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
              >
                Demo pública
              </Link>
              <Link
                href="/admin/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
              >
                Panel administrador
              </Link>
              <a
                href="#precios"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
              >
                Precios
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="font-semibold text-foreground">Contacto</p>
            <div className="mt-4 space-y-3">
              <a
                href="https://wa.me/541155550199"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
              >
                <Phone className="size-4" />
                +54 11 5555 0199
              </a>
              <a
                href="mailto:hola@reservaya.demo"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:translate-x-1"
              >
                <Mail className="size-4" />
                hola@reservaya.demo
              </a>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Lun-Vie 9:00 a 18:00
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {productName}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              Términos
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
