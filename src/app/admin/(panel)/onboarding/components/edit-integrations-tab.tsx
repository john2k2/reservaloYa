"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Plug, Unplug } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

interface EditIntegrationsTabProps {
  businessSlug: string;
  mpConnected: boolean;
  mpCollectorId?: string;
  mpOAuthUrl: string | null;
  onDisconnect: () => Promise<void>;
}

export function EditIntegrationsTab({
  businessSlug,
  mpConnected,
  mpCollectorId,
  mpOAuthUrl,
  onDisconnect,
}: EditIntegrationsTabProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  const isCurrentlyConnected = mpConnected && !disconnected;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      setDisconnected(true);
    } catch (err) {
      console.error("Error desconectando MP:", err);
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

      {/* Info banner */}
      <div className="mt-4 rounded-2xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Al conectar tu cuenta, los pagos online van directo a tu Mercado Pago. Si prefieres no conectarlo todavía, ReservaYa mantiene el flujo de reservas y muestra el pago en efectivo como alternativa.
        </p>
      </div>

      {/* Hidden field to pass businessSlug to onDisconnect */}
      <input type="hidden" name="businessSlug" value={businessSlug} />
    </article>
  );
}
