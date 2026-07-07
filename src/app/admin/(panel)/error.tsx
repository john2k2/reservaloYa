"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "admin-panel-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Panel de administración
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Algo no salió bien
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Ya registramos el incidente. Podés reintentar ahora o volver al dashboard.
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
            href="/admin/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
