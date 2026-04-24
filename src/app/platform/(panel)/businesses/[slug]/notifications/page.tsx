import { ArrowLeft, CheckCircle2, Mail, MessageCircle, XCircle } from "lucide-react";
import Link from "next/link";

import { getBusinessNotificationHistory } from "@/server/queries/platform";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  confirmation: "Confirmación",
  reminder: "Recordatorio",
  followup: "Pedido de reseña",
  cancellation: "Cancelación",
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageCircle,
};

export default async function BusinessNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let history;
  try {
    history = await getBusinessNotificationHistory(slug);
  } catch (err) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive text-sm">
        {err instanceof Error ? err.message : "Error al cargar el historial"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/businesses"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Negocios
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Historial de notificaciones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          /{slug} · últimos 100 eventos
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="hidden lg:grid grid-cols-[100px_120px_140px_1fr_80px] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Canal</span>
          <span>Tipo</span>
          <span>Destinatario</span>
          <span>Asunto / Nota</span>
          <span>Estado</span>
        </div>

        <div className="divide-y divide-border/40">
          {history.length === 0 ? (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">
              No hay notificaciones registradas para este negocio.
            </p>
          ) : (
            history.map((row) => {
              const ChannelIcon = CHANNEL_ICONS[row.channel] ?? Mail;
              const isSent = row.status === "sent";
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 lg:grid-cols-[100px_120px_140px_1fr_80px] gap-2 lg:gap-4 items-start px-6 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <ChannelIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs capitalize text-foreground">{row.channel}</span>
                  </div>

                  <div>
                    <span className="text-xs text-foreground">
                      {KIND_LABELS[row.kind] ?? row.kind}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(row.createdAt).toLocaleString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground truncate">{row.recipient}</p>

                  <div className="min-w-0">
                    {row.subject && (
                      <p className="text-xs font-medium text-foreground truncate">{row.subject}</p>
                    )}
                    {row.note && (
                      <p className="text-xs text-muted-foreground truncate">{row.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isSent ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Enviado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-3.5 text-red-400 shrink-0" />
                        <span className="text-xs text-red-500">Fallido</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
