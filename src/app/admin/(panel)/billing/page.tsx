import { redirect } from "next/navigation";
import { CreditCard, CalendarDays, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminBillingData } from "@/server/queries/admin";
import { cancelSubscriptionAction } from "./actions";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const statusConfig = {
  trial: {
    label: "Período de prueba",
    icon: Clock,
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
  active: {
    label: "Activa",
    icon: CheckCircle2,
    className: "text-green-600 bg-green-50 border-green-200",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    className: "text-red-600 bg-red-50 border-red-200",
  },
  suspended: {
    label: "Suspendida",
    icon: AlertTriangle,
    className: "text-orange-600 bg-orange-50 border-orange-200",
  },
} as const;

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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <CreditCard className="size-6 text-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Suscripción</h1>
      </div>

      {params.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      {params.cancelled && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Tu suscripción fue cancelada. Seguís teniendo acceso hasta la fecha indicada.
        </div>
      )}

      {/* Estado actual */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Estado actual
        </h2>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${config.className}`}>
          <StatusIcon className="size-4" />
          {config.label}
        </div>

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
                    {isCancelled ? "Acceso hasta" : "Próximo cobro"}
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

        {!subscription && (
          <p className="text-sm text-muted-foreground">
            No encontramos información de suscripción. Contactanos a{" "}
            <a href="mailto:soporte@reservaya.app" className="underline">
              soporte@reservaya.app
            </a>
            .
          </p>
        )}
      </div>

      {/* Cancelar suscripción */}
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
            . Después de esa fecha no se realizarán más cobros.
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

      {isCancelled && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿Querés reactivar tu cuenta? Escribinos a{" "}
            <a href="mailto:soporte@reservaya.app" className="underline text-foreground">
              soporte@reservaya.app
            </a>{" "}
            y te ayudamos.
          </p>
        </div>
      )}
    </div>
  );
}
