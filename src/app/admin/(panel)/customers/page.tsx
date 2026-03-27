import { Search, Calendar, FileText, Download, Phone, CalendarClock } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminCustomersDataWithFilter } from "@/server/queries/admin";

function formatDateLabel(date: string | null) {
  if (!date) return "Sin turnos";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

type AdminCustomersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const customers = await getAdminCustomersDataWithFilter(query);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Base de contactos y historial de turnos.</p>
        </div>
        <Link
          href={query ? `/admin/export/customers?q=${encodeURIComponent(query)}` : "/admin/export/customers"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-2 shrink-0")}
        >
          <Download className="size-4" />
          Exportar CSV
        </Link>
      </header>

      {/* Búsqueda */}
      <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <form className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Buscar por nombre, teléfono o email..."
              className="h-9 w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-foreground/30"
            />
          </div>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9")}
          >
            Buscar
          </button>
        </form>
      </section>

      {/* Grid de clientes */}
      {customers.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/bookings?q=${encodeURIComponent(customer.fullName)}`}
                    className="truncate font-semibold text-card-foreground hover:underline block"
                    title="Ver turnos de este cliente"
                  >
                    {customer.fullName}
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    {customer.phone && (
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir en WhatsApp"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                      >
                        <Phone className="size-3" />
                        WA
                      </a>
                    )}
                  </div>
                  {customer.email && (
                    <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium" title={`${customer.bookingsCount} turno${customer.bookingsCount !== 1 ? "s" : ""}`}>
                  {customer.bookingsCount}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-border/30 pt-3">
                <p className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span className="font-medium text-foreground">Último:</span> {formatDateLabel(customer.lastBookingDate)}
                </p>
                {customer.notes && (
                  <p className="flex items-start gap-1.5 line-clamp-2">
                    <FileText className="size-3.5 shrink-0 mt-0.5" />
                    {customer.notes}
                  </p>
                )}
              </div>
              {customer.bookingsCount > 0 && (
                <Link
                  href={`/admin/bookings?q=${encodeURIComponent(customer.fullName)}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "mt-2 h-7 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarClock className="size-3" />
                  Ver {customer.bookingsCount} turno{customer.bookingsCount !== 1 ? "s" : ""}
                </Link>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-border/60 bg-background p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {query ? "No se encontraron clientes con esa búsqueda." : "Todavía no hay clientes guardados."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {query
              ? "Prueba otro nombre, teléfono o email para encontrar coincidencias."
              : "A medida que entren reservas, vas a ver aca el historial y los datos de contacto."}
          </p>
        </div>
      )}
    </div>
  );
}
