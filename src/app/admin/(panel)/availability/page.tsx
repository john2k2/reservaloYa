import { getAdminAvailabilityData } from "@/server/queries/admin";

const weekDays = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export default async function AdminAvailabilityPage() {
  const availability = await getAdminAvailabilityData();

  return (
    <div className="flex flex-col items-center space-y-8">
      <section className="w-full">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Disponibilidad
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Lectura rápida del horario base y de los bloqueos especiales que afectan las reservas.
        </p>
      </section>

      <div className="grid w-full gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Horarios regulares
            </h3>
            <span className="soft-chip">Modo lectura</span>
          </div>

          <div className="space-y-4">
            {availability.rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-border/60 bg-secondary/5 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {weekDays[rule.dayOfWeek]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rule.active ? "Disponible para reservas" : "Sin atención"}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                  {rule.startTime} a {rule.endTime}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Bloqueos especiales
            </h3>

            {availability.blockedSlots.length > 0 ? (
              <div className="space-y-3">
                {availability.blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-lg border border-border/60 bg-secondary/10 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{slot.blockedDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {slot.startTime} a {slot.endTime}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{slot.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/50 bg-secondary/20 p-8 text-center">
                <p className="text-sm font-medium text-foreground">No hay bloqueos activos</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ideal para feriados, vacaciones o cortes puntuales de agenda.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
