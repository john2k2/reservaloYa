"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, MessageCircle, Plug, Unplug } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

interface EditIntegrationsTabProps {
  businessSlug: string;
  mpConnected: boolean;
  mpCollectorId?: string;
  mpOAuthUrl: string | null;
  whatsappConfigured: boolean;
  onDisconnect: () => Promise<void>;
}

const WA_TEMPLATES = [
  {
    name: "reservaya_confirmacion",
    label: "Confirmación de turno",
    description: "Se envía al cliente cuando su reserva queda confirmada.",
  },
  {
    name: "reservaya_recordatorio",
    label: "Recordatorio de turno",
    description: "Se envía 24 hs antes del turno.",
  },
  {
    name: "reservaya_resena",
    label: "Pedido de reseña",
    description: "Se envía después del servicio para pedir una opinión.",
  },
];

export function EditIntegrationsTab({
  businessSlug,
  mpConnected,
  mpCollectorId,
  mpOAuthUrl,
  whatsappConfigured,
  onDisconnect,
}: EditIntegrationsTabProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const isCurrentlyConnected = mpConnected && !disconnected;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setDisconnectError(null);
    try {
      await onDisconnect();
      setDisconnected(true);
    } catch (err) {
      setDisconnectError(
        err instanceof Error ? err.message : "No se pudo desconectar la cuenta. Intentá de nuevo."
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Plug aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Integraciones</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Conectá tu cuenta de Mercado Pago para cobrar online. Si no la conectas, tus clientes igualmente pueden reservar y pagar en efectivo en el local.
          </p>
        </div>
      </div>

      {/* MercadoPago card */}
      <div className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#009EE3]/10">
              <span className="text-sm font-bold text-[#009EE3]">MP</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">MercadoPago</p>
              {isCurrentlyConnected && mpCollectorId ? (
                <p className="text-xs text-muted-foreground">
                  Cuenta conectada · ID {mpCollectorId}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No conectado - las reservas siguen activas y el cobro queda en efectivo
                </p>
              )}
            </div>
          </div>

          {isCurrentlyConnected ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-sm font-medium text-success">
                Conectado
              </span>
            </div>
          ) : (
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {isCurrentlyConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 gap-2",
                isDisconnecting && "cursor-not-allowed opacity-50"
              )}
            >
              <Unplug className="size-3.5" />
              {isDisconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          ) : mpOAuthUrl ? (
            <a
              href={mpOAuthUrl}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-10 gap-2"
              )}
            >
              Conectar con MercadoPago
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              MP_APP_ID o MP_APP_SECRET no configurados. Revisá las variables de entorno.
            </p>
          )}
        </div>
      </div>

      {disconnectError && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 dark:border-red-400/20 dark:bg-red-400/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{disconnectError}</p>
        </div>
      )}

      {/* Info banner */}
      <div className="mt-4 rounded-2xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Al conectar tu cuenta, los pagos online van directo a tu Mercado Pago. Si prefieres no conectarlo todavía, ReservaYa mantiene el flujo de reservas y muestra el pago en efectivo como alternativa.
        </p>
      </div>

      {/* WhatsApp */}
      <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10">
              <MessageCircle className="size-5 text-[#25D366]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">WhatsApp Business</p>
              <p className="text-xs text-muted-foreground">
                {whatsappConfigured
                  ? "API configurada — notificaciones activas cuando los templates sean aprobados"
                  : "No configurado — contactá a ReservaYa para activarlo"}
              </p>
            </div>
          </div>
          {whatsappConfigured ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-sm font-medium text-success">Configurado</span>
            </div>
          ) : (
            <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>

        {whatsappConfigured && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Templates de mensaje
            </p>
            {WA_TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 px-4 py-3"
              >
                <Clock className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{tpl.label}</p>
                  <p className="text-xs text-muted-foreground">{tpl.description}</p>
                  <code className="mt-1 inline-block text-[11px] text-muted-foreground font-mono">
                    {tpl.name}
                  </code>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Pendiente aprobación
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Los templates deben ser aprobados por Meta antes de enviarse. El proceso tarda entre 24 y 72 horas. Una vez aprobados, las notificaciones funcionan automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Hidden field to pass businessSlug to onDisconnect */}
      <input type="hidden" name="businessSlug" value={businessSlug} />
    </article>
  );
}
