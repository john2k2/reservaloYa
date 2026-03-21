"use client";

import { useEffect } from "react";

import "./globals.css";

import { getSiteWhatsAppHref, siteContact } from "@/lib/contact";
import { reportClientIssue } from "@/lib/monitoring/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientIssue({
      source: "global-error-boundary",
      message: error.message || "Unexpected application error",
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-background text-foreground">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              ReservaYa
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              Ocurrio un error inesperado
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Ya registramos el incidente en los logs del entorno. Podes reintentar ahora o escribirnos para soporte.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Reintentar
              </button>
              <a
                href={getSiteWhatsAppHref("Hola, tuve un error en ReservaYa y necesito ayuda.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Escribir por WhatsApp
              </a>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Tambien podes escribir a <a className="underline underline-offset-4" href={`mailto:${siteContact.email}`}>{siteContact.email}</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
