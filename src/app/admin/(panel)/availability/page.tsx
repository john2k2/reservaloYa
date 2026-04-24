import { Clock3, LockKeyhole, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { removeBlockedSlotAction } from "@/app/admin/(panel)/availability/actions";
import { AvailabilityBlockForm } from "@/app/admin/(panel)/availability/availability-block-form";
import { WeekScheduleForm } from "@/app/admin/(panel)/availability/week-schedule-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminAvailabilityData } from "@/server/queries/admin";

const weekDays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatBlockedDateLabel(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}


export default async function AdminAvailabilityPage() {
  const availability = await getAdminAvailabilityData();

  if (!availability) {
    redirect("/admin/onboarding");
  }

  const rulesByDay = new Map(availability.rules.map((rule) => [rule.dayOfWeek, rule]));
  const weekSchedule = weekDays.map((label, dayOfWeek) => {
    const existingRule = rulesByDay.get(dayOfWeek);
    return {
      dayOfWeek, label,
      ruleId: existingRule?.id ?? "",
      startTime: existingRule?.startTime ?? "09:00",
      endTime: existingRule?.endTime ?? "18:00",
      active: existingRule?.active ?? false,
    };
  });
  const defaultBlockedDate = new Date().toISOString().slice(0, 10);
  const defaultDayOfWeek = new Date(`${defaultBlockedDate}T12:00:00`).getDay();
  const activeDays = weekSchedule.filter((r) => r.active).length;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Horarios de atención</h1>
          <p className="text-sm text-muted-foreground">
            Definí los días y horarios en que atendés, y bloqueá fechas especiales.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-medium">
          {activeDays} días activos
        </span>
      </header>

      {/* Layout 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Horarios semanales */}
        <section className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Horarios semanales</h2>
            <p className="text-xs text-muted-foreground">Activá los días que atendés y sus horarios.</p>
          </div>

          <WeekScheduleForm weekSchedule={weekSchedule} />
        </section>

        {/* Columna derecha: Bloqueos */}
        <div className="space-y-6">
          {/* Agregar bloqueo */}
          <section className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                <LockKeyhole className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Bloqueos</h2>
                <p className="text-xs text-muted-foreground">Para almuerzos, feriados o eventos.</p>
              </div>
            </div>
            <AvailabilityBlockForm
              defaultDate={defaultBlockedDate}
              defaultDayOfWeek={defaultDayOfWeek}
              weekDays={weekDays}
            />
          </section>

          {/* Lista de bloqueos */}
          <section className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Bloqueos activos
              </h3>
              <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs">
                {availability.blockedSlots.length}
              </span>
            </div>

            {availability.blockedSlots.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availability.blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-secondary/10 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{formatBlockedDateLabel(slot.blockedDate)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{slot.reason}</p>
                    </div>
                    <form action={removeBlockedSlotAction}>
                      <input type="hidden" name="blockedSlotId" value={slot.id} />
                      <input type="hidden" name="blockedDate" value={slot.blockedDate} />
                      <button
                        type="submit"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "shrink-0 text-destructive hover:bg-destructive/10")}
                        aria-label="Quitar bloqueo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 bg-secondary/20 p-4 text-center">
                <p className="text-sm font-medium text-foreground">No hay bloqueos activos.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Si necesitas reservar un almuerzo, feriado o evento, agregalo desde el formulario de arriba.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
