"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function BusinessPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "public-business-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          ReservaYa
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Algo no salió bien
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          No pudimos cargar esta página. Podés intentar de nuevo en unos segundos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    </main>
  );
}
