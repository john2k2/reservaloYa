import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import type { Metadata } from "next";

import {
  countSupportThreadsNeedingReply,
  listSupportThreads,
  type SupportThreadFilter,
} from "@/server/support-inbox";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Consultas · Plataforma · ReservaYa" },
  description: "Inbox de consultas comerciales de ReservaYa.",
  robots: { index: false, follow: false },
};

const FILTERS: Array<{ id: SupportThreadFilter; label: string }> = [
  { id: "needs_reply", label: "Sin responder" },
  { id: "answered", label: "Respondidas" },
  { id: "closed", label: "Cerradas" },
  { id: "all", label: "Todas" },
];

interface PlatformConsultasPageProps {
  searchParams: Promise<{ filtro?: string }>;
}

function parseFilter(value: string | undefined): SupportThreadFilter {
  if (value === "answered" || value === "closed" || value === "all" || value === "needs_reply") {
    return value;
  }
  return "needs_reply";
}

export default async function PlatformConsultasPage({ searchParams }: PlatformConsultasPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.filtro);

  let threads;
  let needsReplyCount = 0;
  try {
    [threads, needsReplyCount] = await Promise.all([
      listSupportThreads(filter),
      countSupportThreadsNeedingReply(),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-sm text-destructive">
        Error al cargar consultas: {msg}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <MessageSquareText className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Plataforma</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Consultas</h1>
          {needsReplyCount > 0 ? (
            <span className="rounded-full bg-ticket/20 px-2.5 py-1 font-mono text-xs font-semibold text-ticket">
              {needsReplyCount} sin responder
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const href =
            item.id === "needs_reply"
              ? "/platform/consultas"
              : `/platform/consultas?filtro=${item.id}`;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="hidden grid-cols-[1.2fr_1fr_auto_auto] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Visitante</span>
          <span>Asunto</span>
          <span>Estado</span>
          <span>Último mensaje</span>
        </div>

        <div className="divide-y divide-border/40">
          {threads.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No hay consultas en este filtro.
            </p>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/platform/consultas/${thread.id}`}
                className="grid grid-cols-1 gap-2 px-6 py-4 transition-colors hover:bg-secondary/40 md:grid-cols-[1.2fr_1fr_auto_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{thread.visitorName}</p>
                  <p className="truncate text-xs text-muted-foreground">{thread.visitorEmail}</p>
                </div>
                <p className="truncate text-sm text-muted-foreground">{thread.subject}</p>
                <div>
                  {thread.status === "closed" ? (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Cerrada
                    </span>
                  ) : thread.needsReply ? (
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Sin responder
                    </span>
                  ) : (
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Respondida
                    </span>
                  )}
                </div>
                <time className="font-mono text-xs text-muted-foreground">
                  {new Date(thread.lastMessageAt).toLocaleString("es-AR")}
                </time>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
