import Link from "next/link";
import { CalendarClock, Clock3, MessageSquareText, Download } from "lucide-react";

import { updateBookingAction } from "@/app/admin/(panel)/bookings/actions";
import { BookingsNotice } from "@/app/admin/(panel)/bookings/bookings-notice";
import { BookingSubmitButton } from "@/app/admin/(panel)/bookings/booking-submit-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminBookingsData } from "@/server/queries/admin";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    status?: string;
    date?: string;
    q?: string;
  }>;
};

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "no_show", label: "No asistió" },
] as const;

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function buildNotice(params: { saved?: string; error?: string }) {
  if (params.error) {
    return { tone: "error" as const, message: params.error };
  }
  if (params.saved) {
    return { tone: "success" as const, message: "Turno actualizado correctamente." };
  }
  return null;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const activeFilters = {
    status: params.status?.trim() ?? "",
    date: params.date?.trim() ?? "",
    q: params.q?.trim() ?? "",
  };
  const bookings = await getAdminBookingsData(activeFilters);
  const notice = buildNotice(params);
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Turnos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná la agenda y actualizá estados.
          </p>
        </div>
        <Link
          href={bookingsExportHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-2 shrink-0 w-full sm:w-auto justify-center"
          )}
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
          <span className="sm:hidden">Exportar</span>
        </Link>
      </header>

      {notice && <BookingsNotice message={notice.message} tone={notice.tone} />}

      {/* Filtros compactos */}
      <section className="rounded-xl border border-border/60 bg-background p-3 sm:p-4 shadow-sm">
        <form className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-2">
          <input
            name="q"
            type="search"
            defaultValue={activeFilters.q}
            placeholder="Buscar cliente..."
            className="h-10 sm:h-9 w-full sm:min-w-[180px] sm:flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
          />
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={activeFilters.status}
              className="h-10 sm:h-9 flex-1 sm:w-28 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
            >
              <option value="">Estado</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              name="date"
              type="date"
              defaultValue={activeFilters.date}
              className="h-10 sm:h-9 w-32 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
            />
          </div>
          <div className="flex gap-2 mt-1 sm:mt-0">
            {hasActiveFilters && (
              <Link
                href="/admin/bookings"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-10 sm:h-9 px-2 flex-1 sm:flex-none justify-center")}
              >
                Limpiar
              </Link>
            )}
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-10 sm:h-9 flex-1 sm:flex-none")}
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      {/* Lista de turnos */}
      {bookings.length > 0 ? (
        <section className="grid gap-3">
          {bookings.map((booking) => (
            <form
              key={booking.id}
              action={updateBookingAction}
              className={cn(
                "rounded-xl border border-border/60 bg-background p-3 sm:p-4 shadow-sm",
                savedBookingId === booking.id && "border-emerald-500/40 bg-emerald-500/5"
              )}
            >
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="redirectStatus" value={activeFilters.status} />
              <input type="hidden" name="redirectDate" value={activeFilters.date} />
              <input type="hidden" name="redirectQ" value={activeFilters.q} />

              <div className="grid gap-4 lg:grid-cols-[280px_1fr_auto]">
                {/* Info del cliente */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{booking.customerName}</h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        savedBookingId === booking.id
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {booking.statusLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{booking.phone}</p>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/40 px-2.5 py-1 text-xs text-foreground">
                    <CalendarClock className="size-3 sm:size-3.5" />
                    {formatDateLabel(booking.bookingDate)} · {booking.startTime}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Servicio: <span className="font-medium text-foreground">{booking.serviceName}</span>
                  </p>
                </div>

                {/* Formulario de edición */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Estado</label>
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="h-10 sm:h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                      className="h-10 sm:h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
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
                      className="h-10 sm:h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <MessageSquareText className="size-3" /> Notas
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      maxLength={400}
                      defaultValue={booking.notes}
                      placeholder="Notas internas..."
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none"
                    />
                  </div>
                </div>

                {/* Botón guardar */}
                <div className="flex lg:items-start">
                  <BookingSubmitButton />
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
