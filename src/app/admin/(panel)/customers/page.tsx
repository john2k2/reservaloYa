import { getAdminCustomersData } from "@/server/queries/admin";

function formatDateLabel(date: string | null) {
  if (!date) {
    return "Sin turnos todavía";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomersData();

  return (
    <div className="flex flex-col items-center space-y-8">
      <section className="w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Clientes
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Base simple para ver contactos, recurrencia y contexto operativo antes de atender.
        </p>
      </section>

      <section className="grid w-full gap-4 md:grid-cols-2">
        {customers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-card-foreground">
                  {customer.fullName}
                </h3>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {customer.email || "Sin email"}
                </p>
              </div>
              <span className="soft-chip">{customer.bookingsCount} turnos</span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Último turno:</span>{" "}
                {formatDateLabel(customer.lastBookingDate)}
              </p>
              <p>
                <span className="font-medium text-foreground">Notas:</span>{" "}
                {customer.notes || "Sin notas internas"}
              </p>
            </div>
          </article>
        ))}
      </section>

      {customers.length === 0 && (
        <section className="w-full rounded-xl border border-border/60 bg-background p-8 text-center text-muted-foreground shadow-sm">
          No hay clientes guardados todavía.
        </section>
      )}
    </div>
  );
}
