"use client";

import { useState } from "react";

import { createBlockedSlotAction } from "@/app/admin/(panel)/availability/actions";
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
  const [blockMode, setBlockMode] = useState<BlockMode>("single");

  return (
    <form action={createBlockedSlotAction} className="mt-6 space-y-4">
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
            Se crearan bloqueos individuales para el dia elegido a partir de la fecha indicada.
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
  );
}
