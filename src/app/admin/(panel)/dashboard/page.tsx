import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Clock3,
  ExternalLink,
  Percent,
  Pointer,
  Send,
} from "lucide-react";

import { runLocalReminderSweepAction } from "@/app/admin/(panel)/dashboard/actions";
import { MetricCard } from "@/components/dashboard/metric-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminDashboardData } from "@/server/queries/admin";

type AdminDashboardPageProps = {
  searchParams: Promise<{
    reminders?: string;
    error?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const dashboardData = await getAdminDashboardData();
  const params = await searchParams;
  const reminderMessage = params.reminders ?? "";
  const errorMessage = params.error ?? "";

  return (
    <div className="flex flex-col items-center space-y-8 pb-10">
      <section className="w-full">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Panel de {dashboardData.businessName}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {dashboardData.demoMode
                ? "Modo demo activo. Puedes revisar turnos, servicios, clientes, embudo web y seguimiento basico."
                : "Resumen operativo del negocio con foco en agenda, clientes y seguimiento."}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/10 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Accesos utiles
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/admin/bookings"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
              >
                Ver turnos
              </Link>
              <Link
                href="/admin/customers"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
              >
                Ver clientes
              </Link>
              <Link
                href="/admin/availability"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
              >
                Disponibilidad
              </Link>
              <Link
                href="/admin/onboarding"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}
              >
                Onboarding
              </Link>
              <Link
                href={`/${dashboardData.businessSlug}`}
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 gap-2")}
              >
                Ver sitio
                <ExternalLink aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(reminderMessage || errorMessage) && (
        <section className="w-full">
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              errorMessage
                ? "border-destructive/20 bg-destructive/10 text-destructive"
                : "border-border/60 bg-card text-card-foreground"
            )}
          >
            {errorMessage || reminderMessage}
          </div>
        </section>
      )}

      <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {dashboardData.analytics && (
        <section className="grid w-full gap-4 lg:grid-cols-4">
          <article className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Visitas
              </h3>
              <BarChart3 aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-card-foreground">
              {dashboardData.analytics.visits}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Fuente principal: {dashboardData.analytics.topSource}
            </p>
          </article>

          <article className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Clics en reservar
              </h3>
              <Pointer aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-card-foreground">
              {dashboardData.analytics.ctaClicks}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboardData.analytics.clickThroughRate}% de las visitas tocaron un CTA
            </p>
          </article>

          <article className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Flujo de reserva
              </h3>
              <BarChart3 aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-card-foreground">
              {dashboardData.analytics.bookingIntents}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboardData.analytics.bookingIntentRate}% de las visitas entraron al flujo
            </p>
          </article>

          <article className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Conversion
              </h3>
              <Percent aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-card-foreground">
              {dashboardData.analytics.conversionRate}%
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dashboardData.analytics.bookingsCreated} reservas creadas desde la web
            </p>
          </article>
        </section>
      )}

      <section className="grid w-full gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Proximos turnos
            </h3>
            <CalendarClock aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {dashboardData.bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-secondary/20"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium text-foreground">{booking.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    <span>
                      {booking.time} - {booking.service}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Recordatorios
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ventana activa: proximas {dashboardData.reminders?.reminderWindowHours ?? 24} hs
                </p>
              </div>
              <Send aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border/50 px-3 py-4">
                <p className="text-2xl font-semibold text-foreground">
                  {dashboardData.reminders?.pending ?? 0}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  listos
                </p>
              </div>
              <div className="rounded-lg border border-border/50 px-3 py-4">
                <p className="text-2xl font-semibold text-foreground">
                  {dashboardData.reminders?.missingEmail ?? 0}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  sin email
                </p>
              </div>
              <div className="rounded-lg border border-border/50 px-3 py-4">
                <p className="text-2xl font-semibold text-foreground">
                  {dashboardData.reminders?.sentRecently ?? 0}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  enviados
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {dashboardData.reminders?.providerReady
                ? "El proveedor de email esta listo para enviar recordatorios."
                : "El flujo ya esta preparado. Solo falta RESEND_API_KEY para enviar en serio."}
            </p>

            {dashboardData.reminders?.nextBookingAt && (
              <p className="mt-2 text-sm text-muted-foreground">
                Proximo turno a recordar: {dashboardData.reminders.nextBookingAt}
              </p>
            )}

            {dashboardData.demoMode && (
              <form action={runLocalReminderSweepAction} className="mt-5">
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 w-full")}
                >
                  Procesar recordatorios demo
                </button>
              </form>
            )}
          </article>

          <article className="rounded-xl border border-border/60 bg-foreground p-6 text-background shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider opacity-70">
              Senales
            </h3>
            <div className="space-y-4">
              {(dashboardData.notifications ?? []).map((item) => (
                <div
                  key={item}
                  className="rounded-md bg-background/10 px-4 py-3 text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
              Canales
            </h3>
            {dashboardData.analytics?.channels?.length ? (
              <div className="space-y-3">
                {dashboardData.analytics.channels.map((channel) => (
                  <div
                    key={channel.source}
                    className="rounded-lg border border-border/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-foreground">{channel.source}</p>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {channel.conversionRate}% conv.
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {channel.visits} visitas, {channel.ctaClicks} clics,{" "}
                      {channel.bookingsCreated} reservas
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aun no hay canales con datos suficientes para comparar.
              </p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
