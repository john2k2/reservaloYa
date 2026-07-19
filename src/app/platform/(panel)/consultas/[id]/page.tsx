import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import {
  buildSupportThreadUrl,
  getSupportThreadById,
  listSupportMessages,
} from "@/server/support-inbox";
import { cn } from "@/lib/utils";
import { ThreadAutoRefresh } from "@/components/support/thread-auto-refresh";
import { StaffReplyForm } from "../staff-reply-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Consulta · Plataforma · ReservaYa" },
  robots: { index: false, follow: false },
};

interface PlatformConsultaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformConsultaDetailPage({
  params,
}: PlatformConsultaDetailPageProps) {
  const { id } = await params;
  const thread = await getSupportThreadById(id);
  if (!thread) notFound();

  const messages = await listSupportMessages(thread.id);
  const visitorUrl = buildSupportThreadUrl(thread.accessToken);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ThreadAutoRefresh enabled={thread.status !== "closed"} />
      <div>
        <Link
          href="/platform/consultas"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a consultas
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{thread.subject}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {thread.visitorName} · {thread.visitorEmail}
          {thread.visitorPhone ? ` · ${thread.visitorPhone}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <a
            href={visitorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
          >
            Link del visitante
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        {messages.map((message) => {
          const fromVisitor = message.author === "visitor";
          const fromAi = message.author === "ai";
          return (
            <div
              key={message.id}
              className={cn(
                "animate-fade-in rounded-xl px-4 py-3 text-sm",
                fromVisitor
                  ? "ml-0 mr-8 bg-secondary/60"
                  : fromAi
                    ? "ml-8 mr-0 bg-violet-500/10 border border-violet-500/20"
                    : "ml-8 mr-0 bg-primary/10 border border-primary/20"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    fromVisitor
                      ? "text-muted-foreground"
                      : fromAi
                        ? "text-violet-600 dark:text-violet-300"
                        : "text-primary"
                  )}
                >
                  {fromVisitor ? "Visitante" : fromAi ? "IA" : "ReservaYa"}
                </span>
                <time className="font-mono text-[10px] text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString("es-AR")}
                </time>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <StaffReplyForm threadId={thread.id} isClosed={thread.status === "closed"} />
      </div>
    </div>
  );
}
