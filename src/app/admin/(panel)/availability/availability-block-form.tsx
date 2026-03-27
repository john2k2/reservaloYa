"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { createBlockedSlotFormAction } from "@/app/admin/(panel)/availability/actions";
import { AvailabilitySubmitButton } from "@/app/admin/(panel)/availability/availability-submit-button";

type AvailabilityBlockFormProps = {
  defaultDate: string;
  defaultDayOfWeek: number;
  weekDays: string[];
};

type BlockMode = "single" | "weekly";

export function AvailabilityBlockForm({
  defaultDate,
  defaultDayOfWeek,
  weekDays,
}: AvailabilityBlockFormProps) {
  const router = useRouter();
  const [blockMode, setBlockMode] = useState<BlockMode>("single");
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState(createBlockedSlotFormAction, null);

  useEffect(() => {
    if (state?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKey((k) => k + 1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlockMode("single");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      {state && (
        <div
          role="alert"
          className={
            state.ok
              ? "mb-4 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success"
              : "mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          }
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          {state.message}
        </div>
      )}

      <form key={formKey} action={action} className="space-y-4">
        <label className="space-y-2 text-sm text-foreground">
          <span className="font-medium">Tipo de bloqueo</span>
          <select
            name="blockMode"
            value={blockMode}
            onChange={(event) => setBlockMode(event.target.value as BlockMode)}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
          >
            <option value="single">Fecha puntual</option>
            <option value="weekly">Repetir cada semana</option>
          </select>
        </label>

        {blockMode === "single" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground">
              <span className="font-medium">Fecha</span>
              <input
                name="blockedDate"
                type="date"
                required
                defaultValue={defaultDate}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
              />
            </label>

            <label className="space-y-2 text-sm text-foreground">
              <span className="font-medium">Motivo</span>
              <input
                name="reason"
                type="text"
                required
                maxLength={120}
                placeholder="Almuerzo o cierre puntual"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/10 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-foreground">
                <span className="font-medium">Desde</span>
                <input
                  name="repeatFromDate"
                  type="date"
                  required
                  defaultValue={defaultDate}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                />
              </label>

              <label className="space-y-2 text-sm text-foreground">
                <span className="font-medium">Repetir cada</span>
                <select
                  name="repeatDayOfWeek"
                  defaultValue={String(defaultDayOfWeek)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                >
                  {weekDays.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <label className="space-y-2 text-sm text-foreground">
                <span className="font-medium">Semanas a bloquear</span>
                <input
                  name="repeatWeeks"
                  type="number"
                  min={1}
                  max={26}
                  defaultValue={12}
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                />
              </label>

              <label className="space-y-2 text-sm text-foreground">
                <span className="font-medium">Motivo</span>
                <input
                  name="reason"
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Cierre semanal, almuerzo o curso"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
                />
              </label>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Se crearán bloqueos individuales para el día elegido a partir de la fecha indicada.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span className="font-medium">Desde</span>
            <input
              name="startTime"
              type="time"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
            />
          </label>

          <label className="space-y-2 text-sm text-foreground">
            <span className="font-medium">Hasta</span>
            <input
              name="endTime"
              type="time"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10"
            />
          </label>
        </div>

        <AvailabilitySubmitButton
          idleLabel={blockMode === "single" ? "Agregar bloqueo puntual" : "Agregar bloqueos semanales"}
          pendingLabel={blockMode === "single" ? "Guardando bloqueo..." : "Guardando bloqueos..."}
          className="w-full"
        />
      </form>
    </div>
  );
}
