import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Clock3,
  ExternalLink,
  Percent,
  Pointer,
  Send,
  TrendingUp,
} from "lucide-react";

import { runLocalReminderSweepAction } from "@/app/admin/(panel)/dashboard/actions";
import { MetricCard } from "@/components/dashboard/metric-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { canAccessAdminRoute } from "@/lib/admin-permissions";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import { getAdminDashboardData, getAdminShellData } from "@/server/queries/admin";

type AdminDashboardPageProps = {
  searchParams: Promise<{
    reminders?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const [dashboardData, shellData] = await Promise.all([
    getAdminDashboardData(),
    getAdminShellData(),
  ]);
  const params = await searchParams;
  const reminderMessage = params.reminders ?? "";
  const errorMessage = params.error ?? "";
  const successMessage = params.success ?? "";
  const canEditSite = canAccessAdminRoute(shellData?.userRole, "/admin/onboarding");

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header con acciones rápidas */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Panel de {dashboardData.businessName}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            {dashboardData.demoMode
              ? "Modo demo activo. Revisá turnos, servicios, clientes y análisis."
              : "Todo lo que necesitás saber de tu negocio, en un solo lugar."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${dashboardData.businessSlug}`}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 gap-2"
            )}
          >
            Ver página pública
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      {/* Alertas */}
      {(reminderMessage || errorMessage || successMessage) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            errorMessage
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : successMessage
                ? "border-success/20 bg-success/10 text-success"
                : "border-border/60 bg-card text-card-foreground"
          )}
          role="alert"
        >
          {errorMessage || successMessage || reminderMessage}
        </div>
      )}

      {/* Métricas principales */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {dashboardData.metrics.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            icon={item.icon}
          />
        ))}
      </section>

      {/* Layout de 3 columnas para pantallas grandes */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_0.9fr] xl:grid-cols-[1.3fr_1fr_0.8fr]">
        {/* Columna 1: Turnos + Analytics */}
        <div className="space-y-6">
          {/* Próximos turnos */}
          <article className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Próximos turnos
              </h2>
              <Link
                href="/admin/bookings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos →
              </Link>
            </div>

            {dashboardData.bookings.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-secondary/20"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{booking.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        <span className="truncate">
                          {booking.time} - {booking.service}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        booking.status === "Confirmado"
                          ? "bg-success/15 text-success"
                          : booking.status === "Pendiente"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">No hay turnos próximos</p>
                <Link
                  href="/admin/bookings"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3"
                  )}
                >
                  Gestionar turnos
                </Link>
              </div>
            )}
          </article>

          {/* Analytics compacto */}
          {dashboardData.analytics && (
            <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Análisis de visitas
              </h2>
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4">
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="size-4" />
                    Visitas
                  </div>
                  <p className="mt-2 text-2xl font-bold">{dashboardData.analytics.visits}</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Pointer className="size-4" />
                    Clics
                  </div>
                  <p className="mt-2 text-2xl font-bold">{dashboardData.analytics.ctaClicks}</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="size-4" />
                    Inicios
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboardData.analytics.bookingIntents}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="size-4" />
                    Conversión
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboardData.analytics.conversionRate}%
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Fuente principal: {dashboardData.analytics.topSource}
              </p>
            </article>
          )}
        </div>

        {/* Columna 2: Recordatorios + Canales */}
        <div className="space-y-6">
          {/* Recordatorios */}
          <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Recordatorios
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ventana: {dashboardData.reminders?.reminderWindowHours ?? 24} hs
                </p>
              </div>
              <Send aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xl font-semibold text-foreground">
                  {dashboardData.reminders?.pending ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  listos
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xl font-semibold text-foreground">
                  {dashboardData.reminders?.missingEmail ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  sin canal
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xl font-semibold text-foreground">
                  {dashboardData.reminders?.sentRecently ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  enviados
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {dashboardData.reminders?.providerReady
                ? "✓ Canal de recordatorios listo"
                : "Configurá Resend o Twilio WhatsApp para enviar recordatorios."}
            </p>

            {(dashboardData.demoMode || dashboardData.reminders) && (
              <form action={runLocalReminderSweepAction} className="mt-4">
                <LoadingButton
                  pendingLabel="Procesando..."
                  className="h-10 w-full text-sm"
                >
                  {dashboardData.demoMode
                    ? "Procesar recordatorios demo"
                    : "Procesar recordatorios"}
                </LoadingButton>
              </form>
            )}
          </article>

          {/* Canales */}
          <article className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
              Origen de clientes
            </h2>
            {dashboardData.analytics?.channels?.length ? (
              <div className="space-y-2">
                {dashboardData.analytics.channels.map((channel) => (
                  <div
                    key={channel.source}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{channel.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.visits} visitas
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {channel.conversionRate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Cuando tengas visitas, verás de dónde vienen tus clientes.
                </p>
              </div>
            )}
          </article>
        </div>

        {/* Columna 3: Alertas + Accesos */}
        <div className="space-y-6">
          {/* Alertas */}
          {dashboardData.notifications && dashboardData.notifications.length > 0 && (
            <article className="rounded-xl border border-border/60 bg-foreground p-5 text-background shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-70">
                Alertas importantes
              </h2>
              <div className="space-y-2">
                {dashboardData.notifications.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-md bg-background/10 px-3 py-2.5 text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Accesos rápidos */}
          <article className="rounded-xl border border-border/60 bg-secondary/10 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/admin/bookings"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full justify-start gap-2 text-sm"
                )}
              >
                <CalendarClock className="size-4" />
                Ver turnos
              </Link>
              <Link
                href="/admin/customers"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full justify-start gap-2 text-sm"
                )}
              >
                <TrendingUp className="size-4" />
                Ver clientes
              </Link>
              <Link
                href="/admin/services"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full justify-start gap-2 text-sm"
                )}
              >
                <Send className="size-4" />
                Servicios
              </Link>
              {canEditSite ? (
                <Link
                  href="/admin/onboarding"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-full justify-start gap-2 text-sm"
                  )}
                >
                  <ExternalLink className="size-4" />
                  Personalizar sitio
                </Link>
              ) : null}
            </div>
          </article>

          {/* Próximo recordatorio */}
          {dashboardData.reminders?.nextBookingAt && (
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
              <p className="text-xs text-muted-foreground">Próximo turno a recordar</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {dashboardData.reminders.nextBookingAt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
