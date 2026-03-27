import { Clock3, LockKeyhole, Trash2 } from "lucide-react";

import { removeBlockedSlotAction, saveAvailabilityRulesAction } from "@/app/admin/(panel)/availability/actions";
import { AvailabilityBlockForm } from "@/app/admin/(panel)/availability/availability-block-form";
import { AvailabilitySubmitButton } from "@/app/admin/(panel)/availability/availability-submit-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminAvailabilityData } from "@/server/queries/admin";

const weekDays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type AdminAvailabilityPageProps = {
  searchParams: Promise<{
    savedDay?: string;
    savedWeek?: string;
    blocked?: string;
    blockedMessage?: string;
    unblocked?: string;
    error?: string;
  }>;
};

function formatBlockedDateLabel(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function buildNotice(params: { savedDay?: string; savedWeek?: string; blocked?: string; blockedMessage?: string; unblocked?: string; error?: string }) {
  if (params.error) return { tone: "error" as const, message: params.error };
  if (params.savedWeek) return { tone: "success" as const, message: "Disponibilidad semanal actualizada." };
  if (params.savedDay) return { tone: "success" as const, message: `Horario actualizado para ${params.savedDay}.` };
  if (params.blockedMessage) return { tone: "success" as const, message: params.blockedMessage };
  if (params.blocked) return { tone: "success" as const, message: `Bloqueo agregado para ${params.blocked}.` };
  if (params.unblocked) return { tone: "success" as const, message: `Bloqueo quitado de ${params.unblocked}.` };
  return null;
}

export default async function AdminAvailabilityPage({ searchParams }: AdminAvailabilityPageProps) {
  const [availability, params] = await Promise.all([getAdminAvailabilityData(), searchParams]);
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
  const notice = buildNotice(params);
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

      {notice && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"
          )}
          role="alert"
        >
          {notice.message}
        </div>
      )}

      {/* Layout 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Horarios semanales */}
        <section className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Horarios semanales</h2>
            <p className="text-xs text-muted-foreground">Activá los días que atendés y sus horarios.</p>
          </div>

          <form action={saveAvailabilityRulesAction} className="space-y-2">
            {weekSchedule.map((rule) => (
              <div
                key={rule.dayOfWeek}
                className={cn(
                  "grid items-center gap-2 rounded-lg border p-3 sm:grid-cols-[100px_80px_1fr_1fr]",
                  rule.active ? "border-border/60 bg-secondary/5" : "border-border/30 bg-secondary/20 opacity-70"
                )}
              >
                <input type="hidden" name={`ruleId_${rule.dayOfWeek}`} value={rule.ruleId} />

                <span className="text-sm font-medium">{rule.label}</span>

                <select
                  name={`active_${rule.dayOfWeek}`}
                  defaultValue={String(rule.active)}
                  className={cn(
                    "h-8 rounded-md border px-2 text-xs outline-none",
                    rule.active ? "border-border bg-background" : "border-border/50 bg-secondary"
                  )}
                >
                  <option value="true">Abierto</option>
                  <option value="false">Cerrado</option>
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">De</span>
                  <input
                    name={`startTime_${rule.dayOfWeek}`}
                    type="time"
                    defaultValue={rule.startTime}
                    disabled={!rule.active}
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">a</span>
                  <input
                    name={`endTime_${rule.dayOfWeek}`}
                    type="time"
                    defaultValue={rule.endTime}
                    disabled={!rule.active}
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            ))}

            <div className="pt-2">
              <AvailabilitySubmitButton
                scopeValue="week"
                idleLabel="Guardar horarios"
                pendingLabel="Guardando..."
                className="h-10 text-sm"
              />
            </div>
          </form>
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
