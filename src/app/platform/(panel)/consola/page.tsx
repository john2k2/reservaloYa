import Link from "next/link";
import { AlertTriangle, CheckCircle2, Terminal, XCircle } from "lucide-react";
import type { Metadata } from "next";

import { getPlatformHealthChecks, getPlatformJobRuns } from "@/server/queries/platform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Consola · Plataforma · ReservaYa" },
  description: "Salud del sistema y jobs fallidos de ReservaYa.",
  robots: { index: false, follow: false },
};

interface PlatformConsolaPageProps {
  searchParams: Promise<{ todos?: string }>;
}

export default async function PlatformConsolaPage({ searchParams }: PlatformConsolaPageProps) {
  const params = await searchParams;
  const showAll = params.todos === "1";

  const [health, jobRuns] = await Promise.all([
    getPlatformHealthChecks(),
    getPlatformJobRuns(showAll ? 50 : 200),
  ]);

  const visibleRuns = showAll
    ? jobRuns
    : jobRuns.filter((run) => run.status === "failed" || run.stuck);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Terminal className="size-5 text-muted-foreground" aria-hidden />
        Consola
      </h1>

      {/* Salud del sistema */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Salud del sistema
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {health.map((check) => (
            <div
              key={check.key}
              className="flex items-start gap-2 rounded-xl border border-border/50 px-3 py-2.5"
            >
              {check.ok ? (
                <CheckCircle2 className="size-4 mt-0.5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="size-4 mt-0.5 text-red-600 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Jobs</h2>
          </div>
          <Link
            href={showAll ? "/platform/consola" : "/platform/consola?todos=1"}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? "Ver solo fallidos" : "Ver todos"}
          </Link>
        </div>

        <div className="divide-y divide-border/40">
          {visibleRuns.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              {showAll
                ? "Sin corridas registradas todavía."
                : "Sin jobs fallidos ni colgados. Todo en orden."}
            </p>
          ) : (
            visibleRuns.map((run) => (
              <div key={run.id} className="flex items-start justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{run.jobName}</p>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        run.status === "failed"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : run.stuck
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : run.status === "running"
                              ? "bg-secondary text-muted-foreground"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {run.stuck
                        ? "Colgado"
                        : run.status === "failed"
                          ? "Falló"
                          : run.status === "running"
                            ? "Corriendo"
                            : "OK"}
                    </span>
                  </div>
                  {run.error && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{run.error}</p>
                  )}
                </div>
                <time className="shrink-0 font-mono text-xs text-muted-foreground">
                  {new Date(run.startedAt).toLocaleString("es-AR")}
                </time>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
