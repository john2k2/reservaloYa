import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingPageShell } from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getSupportThreadByToken, listSupportMessages } from "@/server/support-inbox";
import { cn } from "@/lib/utils";
import { ThreadAutoRefresh } from "@/components/support/thread-auto-refresh";
import { VisitorReplyForm } from "./visitor-reply-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Tu consulta · ReservaYa",
    description: "Seguí tu consulta comercial con ReservaYa desde este link privado.",
    path: "/consulta",
  }),
  robots: { index: false, follow: false },
};

interface ConsultaPageProps {
  params: Promise<{ token: string }>;
}

function authorLabel(author: string) {
  if (author === "staff" || author === "ai" || author === "system") return "ReservaYa";
  return "Vos";
}

export default async function ConsultaPage({ params }: ConsultaPageProps) {
  const { token } = await params;
  const thread = await getSupportThreadByToken(token);
  if (!thread) notFound();

  const messages = await listSupportMessages(thread.id);

  return (
    <LandingPageShell>
      <ThreadAutoRefresh enabled={thread.status !== "closed"} />
      <div className="mx-auto max-w-2xl px-6 py-16 pt-32 sm:py-24 sm:pt-36">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ticket">
          Link privado
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
          {thread.subject}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hola {thread.visitorName}. Guardá esta página: es tu acceso a la conversación.
          {thread.status === "closed" ? " · Consulta cerrada." : null}
        </p>

        <div className="mt-8 space-y-3 rounded-2xl border border-rule bg-card p-4 sm:p-5">
          {messages.map((message) => {
            const fromVisitor = message.author === "visitor";
            return (
              <div
                key={message.id}
                className={cn(
                  "animate-fade-in rounded-xl px-4 py-3 text-sm",
                  fromVisitor ? "bg-secondary/60 ml-0 mr-6" : "bg-sello/10 ml-6 mr-0"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {authorLabel(message.author)}
                  </span>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString("es-AR")}
                  </time>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{message.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <VisitorReplyForm accessToken={token} disabled={thread.status === "closed"} />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ¿Perdiste el link? Escribinos de nuevo desde{" "}
          <Link href="/contacto" className="text-sello underline underline-offset-2">
            Contacto
          </Link>
          .
        </p>
      </div>
    </LandingPageShell>
  );
}
