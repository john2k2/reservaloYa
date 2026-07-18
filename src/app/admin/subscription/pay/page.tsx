import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Building2, CreditCard } from "lucide-react";

import { getAdminShellData } from "@/server/queries/admin";
import { getSubscriptionArsPrice, SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";
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
    <div className="landing-theme flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Abonar tu suscripción
          </h1>
          <p className="text-muted-foreground">
            {businessName} — USD {SUBSCRIPTION_USD_PRICE}/mes
            {formattedArs ? ` (≈ $${formattedArs} ARS)` : ""}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {showTransfer && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Transferencia bancaria (ARS)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Transferí el monto en pesos y subí el comprobante acá. Lo revisamos y te activamos el
              acceso el mismo día.
            </p>
            <dl className="space-y-2 rounded-lg border border-border bg-background px-4 py-3 text-sm">
              {transfer.holder && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Titular</dt>
                  <dd className="font-medium text-right">{transfer.holder}</dd>
                </div>
              )}
              {transfer.bank && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Banco</dt>
                  <dd className="font-medium text-right">{transfer.bank}</dd>
                </div>
              )}
              {transfer.alias && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Alias</dt>
                  <dd className="font-mono font-medium text-right">{transfer.alias}</dd>
                </div>
              )}
              {transfer.cbu && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">CBU/CVU</dt>
                  <dd className="font-mono font-medium text-right break-all">{transfer.cbu}</dd>
                </div>
              )}
              {formattedArs && (
                <div className="flex justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Monto sugerido</dt>
                  <dd className="font-mono font-semibold">${formattedArs} ARS</dd>
                </div>
              )}
            </dl>
            {pendingClaim ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Comprobante recibido. Estamos revisándolo
                {pendingClaim.createdAt
                  ? ` (enviado ${new Date(pendingClaim.createdAt).toLocaleString("es-AR")})`
                  : ""}
                .
              </div>
            ) : (
              <TransferReceiptForm />
            )}
            <p className="text-center text-xs text-muted-foreground">
              ¿Problemas para subir el archivo?{" "}
              <a href={whatsappHref} className="underline" target="_blank" rel="noopener noreferrer">
                Escribinos por WhatsApp
              </a>
              .
            </p>
          </section>
        )}

        {showPolar && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Tarjeta / USD (Polar)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Pago con tarjeta en dólares. La suscripción se renueva automáticamente cada mes.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan mensual</span>
              <span className="font-mono font-medium">USD {SUBSCRIPTION_USD_PRICE}</span>
            </div>
            <Link
              href="/api/payments/polar/checkout"
              className={cn(
                "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold",
                "border border-border bg-background text-foreground",
                "transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              )}
            >
              Pagar con tarjeta
              <ArrowRight className="size-4" />
            </Link>
          </section>
        )}

        {!showTransfer && !showPolar && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-3 text-sm text-amber-900">
            <p className="font-medium">No hay métodos de pago automáticos configurados.</p>
            <p>
              Escribinos por WhatsApp y te pasamos los datos para transferir y activar tu cuenta.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex font-semibold underline"
            >
              Hablar por WhatsApp
            </a>
          </section>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para pagar?{" "}
          <a href={whatsappHref} className="underline" target="_blank" rel="noopener noreferrer">
            Contactanos
          </a>
          .
        </p>
      </div>
    </div>
  );
}
