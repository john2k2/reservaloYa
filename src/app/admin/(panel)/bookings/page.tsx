import { getAdminBookingsData } from "@/server/queries/admin";

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookingsData();

  return (
    <div className="flex flex-col items-center space-y-8">
      <section className="w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Turnos
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Agenda ordenada por fecha para revisar clientes, servicio y estado sin salir del panel.
        </p>
      </section>

      <section className="w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Cliente
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Fecha
              </th>
              <th className="hidden px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground md:table-cell">
                Servicio
              </th>
              <th className="hidden px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground lg:table-cell">
                Notas
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {bookings.map((booking) => (
              <tr key={booking.id} className="transition-colors hover:bg-secondary/10">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{booking.customerName}</div>
                  <div className="text-xs text-muted-foreground">{booking.phone}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {formatDateLabel(booking.bookingDate)} · {booking.startTime}
                </td>
                <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                  {booking.serviceName}
                </td>
                <td className="hidden max-w-[280px] truncate px-6 py-4 text-muted-foreground lg:table-cell">
                  {booking.notes || "Sin notas"}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bookings.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay turnos cargados todavía.
          </div>
        )}
      </section>
    </div>
  );
}
