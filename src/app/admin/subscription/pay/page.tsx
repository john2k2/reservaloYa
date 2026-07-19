import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, CreditCard } from "lucide-react";

import { getAdminShellData } from "@/server/queries/admin";
import {
  getSubscriptionArsPrice,
  SUBSCRIPTION_CARD_USD_PRICE,
  SUBSCRIPTION_USD_PRICE,
} from "@/server/payments-domain";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { isPolarConfigured } from "@/server/polar-config";
import {
  buildTransferWhatsAppMessage,
  getBillingTransferDetails,
  hasBillingTransferDetails,
} from "@/server/billing-transfer";
import { getPendingTransferClaimForBusiness } from "@/server/billing-transfer-claims";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { SelloStamp } from "@/components/landing/sello-stamp";
import "@/app/landing-animations.css";
import { TransferReceiptForm } from "./transfer-receipt-form";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Abonar suscripción · ReservaYa",
  path: "/admin/subscription/pay",
  description: "Reactivá tu acceso al panel de ReservaYa abonando la suscripción mensual.",
});

const ERROR_MESSAGES: Record<string, string> = {
  polar_not_configured: "El pago con tarjeta no está configurado todavía. Usá transferencia bancaria.",
  payment_failed: "El pago no se completó. Podés reintentar o pagar por transferencia.",
  payment_pending: "Tu pago quedó pendiente. Cuando se acredite, te reactivamos el acceso.",
  unauthorized: "Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.",
};

interface SubscriptionPayPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SubscriptionPayPage({ searchParams }: SubscriptionPayPageProps) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    redirect("/login");
  }

  if (!shellData.subscriptionExpired) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);
  const formattedArs = arsPrice > 0 ? Math.round(arsPrice).toLocaleString("es-AR") : null;
  const showPolar = isPolarConfigured();
  const transfer = getBillingTransferDetails();
  const showTransfer = hasBillingTransferDetails(transfer);
  const businessName = shellData.businessName || "mi negocio";
  const pendingClaim = shellData.businessId
    ? await getPendingTransferClaimForBusiness(shellData.businessId)
    : null;
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? `No pudimos procesar el pago (${params.error}).`)
    : null;

  const whatsappHref = getSiteWhatsAppHref(
    buildTransferWhatsAppMessage({
      businessName,
      amountArsLabel: formattedArs ?? undefined,
    })
  );

  return (
    <div className="landing-theme relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 bg-background">
      {/* Renglones de agenda — atmósfera, sin orbes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, color-mix(in srgb, var(--rule) 55%, transparent) 31px, color-mix(in srgb, var(--rule) 55%, transparent) 32px)",
        }}
      />

      <div className="relative w-full max-w-lg space-y-8">
        <header className="space-y-3 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-ticket">
            Acceso pausado
          </p>
          <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Reactivá tu panel
          </h1>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{businessName}</span>
            {" — "}
            elegí cómo seguir el mes.
          </p>
        </header>

        {errorMessage && (
          <div className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {showTransfer && (
          <section className="relative">
            {/* Sello flotante — firma visual */}
            <div className="pointer-events-none absolute -right-2 -top-5 z-10 sm:-right-4 sm:-top-6">
              <div className="animate-stamp-hit">
                <SelloStamp label="Promo" sublabel={`USD ${SUBSCRIPTION_USD_PRICE}`} rotate={-12} />
              </div>
            </div>

            {/* Talón de pago */}
            <div className="relative overflow-hidden rounded-2xl border border-rule bg-card shadow-[0_20px_50px_-28px_color-mix(in_srgb,var(--ink)_55%,transparent)]">
              <div className="flex items-center justify-between border-b border-dashed border-rule px-5 py-3.5 sm:px-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Transferencia ARS
                </span>
                <span className="rounded-sm bg-ticket/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ticket">
                  Mejor precio
                </span>
              </div>

              <div className="space-y-5 px-5 py-6 sm:px-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Monto del mes
                  </p>
                  {formattedArs ? (
                    <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                      <span className="text-2xl font-semibold text-muted-foreground sm:text-3xl">
                        $
                      </span>
                      {formattedArs}
                    </p>
                  ) : (
                    <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-foreground">
                      USD {SUBSCRIPTION_USD_PRICE}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Equivalente a{" "}
                    <span className="font-mono font-semibold text-sello">
                      USD {SUBSCRIPTION_USD_PRICE}
                    </span>{" "}
                    al dólar blue · activación el mismo día
                  </p>
                </div>

                <dl className="divide-y divide-rule border-y border-rule text-sm">
                  {transfer.holder && (
                    <div className="flex justify-between gap-3 py-2.5">
                      <dt className="text-muted-foreground">Titular</dt>
                      <dd className="text-right font-medium">{transfer.holder}</dd>
                    </div>
                  )}
                  {transfer.bank && (
                    <div className="flex justify-between gap-3 py-2.5">
                      <dt className="text-muted-foreground">Banco</dt>
                      <dd className="text-right font-medium">{transfer.bank}</dd>
                    </div>
                  )}
                  {transfer.alias && (
                    <div className="flex justify-between gap-3 py-2.5">
                      <dt className="text-muted-foreground">Alias</dt>
                      <dd className="font-mono text-right text-base font-bold tracking-wide text-sello">
                        {transfer.alias}
                      </dd>
                    </div>
                  )}
                  {transfer.cbu && (
                    <div className="flex justify-between gap-3 py-2.5">
                      <dt className="text-muted-foreground">CBU/CVU</dt>
                      <dd className="break-all text-right font-mono font-medium">{transfer.cbu}</dd>
                    </div>
                  )}
                </dl>

                {pendingClaim ? (
                  <div className="rounded-xl border border-ticket/50 bg-ticket/10 px-4 py-3 text-sm text-foreground">
                    <p className="font-semibold">Comprobante recibido</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Lo estamos revisando
                      {pendingClaim.createdAt
                        ? ` · enviado ${new Date(pendingClaim.createdAt).toLocaleString("es-AR")}`
                        : ""}
                      . Te avisamos cuando esté activo.
                    </p>
                  </div>
                ) : (
                  <TransferReceiptForm />
                )}

                <p className="text-center text-xs text-muted-foreground">
                  ¿Problemas para subir el archivo?{" "}
                  <a
                    href={whatsappHref}
                    className="font-medium text-sello underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escribinos por WhatsApp
                  </a>
                  .
                </p>
              </div>

              {/* Perforaciones del talón */}
              <div className="pointer-events-none absolute -left-3 top-[72px] size-6 rounded-full bg-background" />
              <div className="pointer-events-none absolute -right-3 top-[72px] size-6 rounded-full bg-background" />
            </div>
          </section>
        )}

        {showPolar && (
          <section className="rounded-2xl border border-dashed border-rule bg-card/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground" aria-hidden />
                  <h2 className="text-sm font-semibold text-foreground">Tarjeta en dólares</h2>
                </div>
                <p className="font-mono text-2xl font-bold tracking-tight">
                  USD {SUBSCRIPTION_CARD_USD_PRICE}
                  <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                    /mes · renovación automática
                  </span>
                </p>
                {showTransfer && (
                  <p className="text-xs text-muted-foreground">
                    Con transferencia ahorrás el precio promo (USD {SUBSCRIPTION_USD_PRICE} al blue).
                  </p>
                )}
              </div>
              <Link
                href="/api/payments/polar/checkout"
                className={cn(
                  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold",
                  "border border-rule bg-background text-foreground",
                  "transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                )}
              >
                Pagar con tarjeta
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </div>
          </section>
        )}

        {!showTransfer && !showPolar && (
          <section className="rounded-2xl border border-ticket/40 bg-ticket/10 p-6 space-y-3 text-sm">
            <p className="font-medium">No hay métodos de pago automáticos configurados.</p>
            <p className="text-muted-foreground">
              Escribinos por WhatsApp y te pasamos los datos para transferir y activar tu cuenta.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex font-semibold text-sello underline underline-offset-2"
            >
              Hablar por WhatsApp
            </a>
          </section>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para pagar?{" "}
          <a
            href={whatsappHref}
            className="font-medium text-sello underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contactanos
          </a>
          .
        </p>
      </div>
    </div>
  );
}
