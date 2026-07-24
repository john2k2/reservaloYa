import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarClock, Clock3, MessageSquareText, Download, Phone, Plus } from "lucide-react";

import { updateBookingAction } from "@/app/admin/(panel)/bookings/actions";
import { BookingSubmitButton } from "@/app/admin/(panel)/bookings/booking-submit-button";
import { bookingStatusOptions } from "@/app/admin/(panel)/bookings/booking-status-options";
import { BookingsFilters } from "@/app/admin/(panel)/bookings/bookings-filters";
import { ManualBookingWrapper } from "@/app/admin/(panel)/bookings/manual-booking-wrapper";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatEsArDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { getAdminBookingsData, getAdminServicesData } from "@/server/queries/admin";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    status?: string;
    date?: string;
    q?: string;
  }>;
};

function formatDateLabel(date: string) {
  return formatEsArDate(date, { weekday: true, month: "2-digit", dateOnly: true });
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const activeFilters = {
    status: params.status?.trim() ?? "",
    date: params.date?.trim() ?? "",
    q: params.q?.trim() ?? "",
  };
  const [bookings, services] = await Promise.all([
    getAdminBookingsData(activeFilters),
    getAdminServicesData(),
  ]);

  if (bookings === null || services === null) {
    redirect("/admin/onboarding");
  }

  const savedBookingId = params.saved ?? "";
  const hasActiveFilters = Boolean(activeFilters.status || activeFilters.date || activeFilters.q);

  const bookingsExportQuery = new URLSearchParams({
    ...(activeFilters.status ? { status: activeFilters.status } : {}),
    ...(activeFilters.date ? { date: activeFilters.date } : {}),
    ...(activeFilters.q ? { q: activeFilters.q } : {}),
  }).toString();

  const bookingsExportHref = bookingsExportQuery
    ? `/admin/export/bookings?${bookingsExportQuery}`
    : "/admin/export/bookings";

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Turnos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná la agenda y actualizá estados.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/admin/bookings?nuevo=1"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-9 gap-2 flex-1 sm:flex-none justify-center"
            )}
          >
            <Plus className="size-4" />
            Nuevo turno
          </Link>
          <Link
            href={bookingsExportHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-2 shrink-0 justify-center"
            )}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">Exportar</span>
          </Link>
        </div>
      </header>

      {/* Formulario turno manual (se muestra si ?nuevo=1) */}
      <ManualBookingWrapper services={services} />

      <Suspense fallback={null}>
        <BookingsFilters
          status={activeFilters.status}
          date={activeFilters.date}
          q={activeFilters.q}
        />
      </Suspense>

      {/* Lista de turnos */}
      {bookings.length > 0 ? (
        <section className="grid gap-3">
          {bookings.map((booking) => (
            <form
              key={booking.id}
              action={updateBookingAction}
              className={cn(
                "rounded-xl border border-border/60 bg-background p-3 shadow-sm",
                savedBookingId === booking.id && "border-success/40 bg-success/5"
              )}
            >
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="redirectStatus" value={activeFilters.status} />
              <input type="hidden" name="redirectDate" value={activeFilters.date} />
              <input type="hidden" name="redirectQ" value={activeFilters.q} />

              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                {/* Info del cliente */}
                <div className="min-w-[220px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{booking.customerName}</h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        savedBookingId === booking.id
                          ? "bg-success/15 text-success"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {booking.statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">{booking.phone}</p>
                    {booking.phone && (
                      <a
                        href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir en WhatsApp"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                      >
                        <Phone className="size-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/40 px-2 py-0.5 text-xs text-foreground">
                    <CalendarClock className="size-3" />
                    {formatDateLabel(booking.bookingDate)} · {booking.startTime}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Servicio: <span className="font-medium text-foreground">{booking.serviceName}</span>
                  </p>
                </div>

                {/* Formulario de edición */}
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label htmlFor={`booking-status-${booking.id}`} className="text-xs font-medium text-foreground">
                        Estado
                      </label>
                      <select
                        id={`booking-status-${booking.id}`}
                        name="status"
                        defaultValue={booking.status}
                        aria-label={`Estado del turno de ${booking.customerName}`}
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-foreground/30"
                      >
                        {bookingStatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} title={opt.hint}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        <CalendarClock className="size-3" /> Fecha
                      </label>
                      <input
                        name="bookingDate"
                        type="date"
                        defaultValue={booking.bookingDate}
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-foreground/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Clock3 className="size-3" /> Hora
                      </label>
                      <input
                        name="startTime"
                        type="time"
                        defaultValue={booking.startTime}
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-foreground/30"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        <MessageSquareText className="size-3" /> Notas
                      </label>
                      <textarea
                        name="notes"
                        rows={1}
                        maxLength={400}
                        defaultValue={booking.notes}
                        placeholder="Notas internas..."
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground/30 resize-none"
                      />
                    </div>
                  </div>

                  {/* Botón guardar */}
                  <div className="flex sm:pb-0">
                    <BookingSubmitButton />
                  </div>
                </div>
              </div>
            </form>
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-border/60 bg-background p-6 sm:p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters ? "No se encontraron turnos con esos filtros." : "Todavía no hay turnos cargados."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Prueba limpiar filtros o revisar otra fecha para ver más resultados."
              : "Cuando entren reservas desde la página pública, vas a poder gestionarlas desde acá."}
          </p>
        </div>
      )}
    </div>
  );
}
