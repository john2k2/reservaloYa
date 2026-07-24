import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatEsArDate } from "@/lib/dates";
import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminBillingData } from "@/server/queries/admin";
import { cancelSubscriptionAction } from "./actions";
import {
  SUBSCRIPTION_CARD_USD_PRICE,
  SUBSCRIPTION_USD_PRICE,
} from "@/server/payments-domain";
import { isPolarConfigured } from "@/server/polar-config";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return formatEsArDate(dateStr, { month: "long" });
}

const statusConfig = {
  trial: {
    label: "Período de prueba",
    icon: Clock,
    tone: "warning",
  },
  active: {
    label: "Activa",
    icon: CheckCircle2,
    tone: "success",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    tone: "danger",
  },
  // "suspended" se corta por falta de pago y bloquea el acceso de inmediato
  // (ver resolveSubscriptionStatus) — es más grave que "trial", entra en
  // "danger" igual que "cancelled" (mismo criterio que el resto del panel
  // platform, donde suspended/cancelled ya se agrupan como el mismo estado).
  suspended: {
    label: "Suspendida",
    icon: AlertTriangle,
    tone: "danger",
  },
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  polar_not_configured: "El portal de Polar no está disponible. Escribinos por WhatsApp.",
};

interface BillingPageProps {
  searchParams: Promise<{
    error?: string;
    cancelled?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const shellData = await requireAdminRouteAccess("/admin/billing");

  if (shellData.userRole !== "owner") {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const billingData = await getAdminBillingData();

  if (!billingData) {
    redirect("/admin/dashboard");
  }

  const { subscription } = billingData;
  const status = subscription?.status ?? "trial";
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const isCancelled = status === "cancelled";
  const canCancel = status === "active" || status === "trial";
  const needsPayment = status === "suspended" || status === "cancelled" || shellData.subscriptionExpired;
  const showPolarPortal = isPolarConfigured() && Boolean(subscription?.polarCustomerId);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? params.error)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <CreditCard className="size-6 text-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Suscripción</h1>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {params.cancelled && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Tu suscripción fue cancelada. Seguís teniendo acceso hasta la fecha indicada.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Estado actual
        </h2>

        <StatusBadge tone={config.tone} size="md" icon={<StatusIcon className="size-4" />}>
          {config.label}
        </StatusBadge>

        <p className="text-sm text-muted-foreground">
          Plan único — promo transferencia USD {SUBSCRIPTION_USD_PRICE}/mes (ARS al blue) o
          tarjeta USD {SUBSCRIPTION_CARD_USD_PRICE}/mes.
        </p>

        {subscription && (
          <dl className="space-y-3 text-sm">
            {subscription.trialEndsAt && status === "trial" && (
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Fin del período de prueba</dt>
                  <dd className="font-medium text-foreground">{formatDate(subscription.trialEndsAt)}</dd>
                </div>
              </div>
            )}

            {subscription.nextBillingDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">
                    {isCancelled ? "Acceso hasta" : "Próximo cobro / renovación"}
                  </dt>
                  <dd className="font-medium text-foreground">{formatDate(subscription.nextBillingDate)}</dd>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <CalendarDays className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-muted-foreground">Suscripto desde</dt>
                <dd className="font-medium text-foreground">{formatDate(subscription.created)}</dd>
              </div>
            </div>
          </dl>
        )}

        {(needsPayment || isCancelled) && (
          <Link
            href="/admin/subscription/pay"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
          >
            Renovar / pagar
            <ArrowRight className="size-4" />
          </Link>
        )}

        {showPolarPortal && (
          <Link
            href="/api/payments/polar/portal"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline"
          >
            Gestionar facturación en Polar
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      {canCancel && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Cancelar suscripción
          </h2>
          <p className="text-sm text-muted-foreground">
            Si cancelás, seguís teniendo acceso hasta{" "}
            {subscription?.nextBillingDate
              ? formatDate(subscription.nextBillingDate)
              : "el fin del período actual"}
            . Si pagás con Polar, también podés cancelar la renovación desde el portal.
          </p>
          <form action={cancelSubscriptionAction} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-sm text-foreground">
                Escribí <strong>CANCELAR</strong> para confirmar
              </label>
              <input
                id="confirm"
                name="confirm"
                type="text"
                placeholder="CANCELAR"
                autoComplete="off"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Cancelar suscripción
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
