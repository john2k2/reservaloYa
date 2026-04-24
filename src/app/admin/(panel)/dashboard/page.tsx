import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  Send,
  TrendingUp,
} from "lucide-react";

import { runLocalReminderSweepAction } from "@/app/admin/(panel)/dashboard/actions";
import { MetricCard } from "@/components/dashboard/metric-card";
import { BookingLinkBar } from "@/components/ui/copy-link-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import {
  getAdminDashboardData,
  getAdminShellData,
  getAdminServicesData,
  getAdminAvailabilityData,
} from "@/server/queries/admin";

export default async function AdminDashboardPage() {
  const [dashboardData, , services, availability] = await Promise.all([
    getAdminDashboardData(),
    getAdminShellData(),
    getAdminServicesData(),
    getAdminAvailabilityData(),
  ]);

  if (!dashboardData || !services || !availability) {
    redirect("/admin/onboarding");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const hasServices = services.length > 0;
  const hasActiveDays = availability.rules.some((r) => r.active);
  const setupDone = hasServices && hasActiveDays;

  const setupSteps = [
    {
      done: hasServices,
      label: "Agregar al menos un servicio",
      href: "/admin/services",
      cta: "Ir a Servicios",
    },
    {
      done: hasActiveDays,
      label: "Activar horarios de atención",
      href: "/admin/availability",
      cta: "Ir a Disponibilidad",
    },
  ];

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
        <Link
          href={`/${dashboardData.businessSlug}`}
          target="_blank"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          Ver página pública
        </Link>
      </header>

      {/* Link de reservas */}
      <BookingLinkBar businessSlug={dashboardData.businessSlug} appUrl={appUrl} />


      {/* Checklist de configuración inicial */}
      {!setupDone && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Completá la configuración para recibir reservas
            </h2>
          </div>
          <div className="space-y-2">
            {setupSteps.map((step) => (
              <div key={step.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-amber-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      step.done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-7 text-xs shrink-0"
                    )}
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
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

      {/* Layout de 2 columnas para pantallas grandes */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Columna 1: Turnos + Analytics */}
        <div className="space-y-6">
          {/* Alerta turnos pendientes */}
          {dashboardData.notifications && dashboardData.notifications.some(n => n.includes("pendientes de confirmar")) && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700">
              <AlertCircle className="size-4 shrink-0" />
              Tenés turnos pendientes de confirmar
              <Link href="/admin/bookings?status=pending" className="ml-auto text-xs underline underline-offset-2">
                Ver →
              </Link>
            </div>
          )}

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
                Actividad de reservas
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarPlus className="size-4" />
                    Clics para reservar
                  </div>
                  <p className="mt-2 text-2xl font-bold">{dashboardData.analytics.ctaClicks}</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="size-4" />
                    Formularios iniciados
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {dashboardData.analytics.bookingIntents}
                  </p>
                </div>
              </div>
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
                  Se avisa con {dashboardData.reminders?.reminderWindowHours ?? 24} hs de anticipación
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
                  para enviar
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xl font-semibold text-foreground">
                  {dashboardData.reminders?.missingEmail ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  sin email
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xl font-semibold text-foreground">
                  {dashboardData.reminders?.sentRecently ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  ya avisados
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {dashboardData.reminders?.providerReady
                ? "✓ Recordatorios por email activos"
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

            {/* Próximo turno a recordar */}
            {dashboardData.reminders?.nextBookingAt && (
              <div className="mt-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">Próximo turno a recordar</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {dashboardData.reminders.nextBookingAt}
                </p>
              </div>
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
                      {channel.conversionRate}% reservaron
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

      </div>
    </div>
  );
}
