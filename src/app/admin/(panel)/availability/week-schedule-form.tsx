"use client";

import { useState } from "react";

import { saveAvailabilityRulesAction } from "@/app/admin/(panel)/availability/actions";
import { AvailabilitySubmitButton } from "@/app/admin/(panel)/availability/availability-submit-button";
import { cn } from "@/lib/utils";

type DayRule = {
  dayOfWeek: number;
  label: string;
  ruleId: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type WeekScheduleFormProps = {
  weekSchedule: DayRule[];
};

export function WeekScheduleForm({ weekSchedule }: WeekScheduleFormProps) {
  const [activeMap, setActiveMap] = useState<Record<number, boolean>>(
    Object.fromEntries(weekSchedule.map((r) => [r.dayOfWeek, r.active]))
  );

  return (
    <form action={saveAvailabilityRulesAction} className="space-y-2">
      {weekSchedule.map((rule) => {
        const isActive = activeMap[rule.dayOfWeek] ?? false;
        return (
          <div
            key={rule.dayOfWeek}
            className={cn(
              "grid items-center gap-2 rounded-lg border p-3 sm:grid-cols-[100px_80px_1fr_1fr]",
              isActive ? "border-border/60 bg-secondary/5" : "border-border/30 bg-secondary/20 opacity-70"
            )}
          >
            <input type="hidden" name={`ruleId_${rule.dayOfWeek}`} value={rule.ruleId} />

            <span className="text-sm font-medium">{rule.label}</span>

            <select
              name={`active_${rule.dayOfWeek}`}
              value={String(isActive)}
              onChange={(e) =>
                setActiveMap((prev) => ({ ...prev, [rule.dayOfWeek]: e.target.value === "true" }))
              }
              className={cn(
                "h-8 rounded-md border px-2 text-xs outline-none",
                isActive ? "border-border bg-background" : "border-border/50 bg-secondary"
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
                disabled={!isActive}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">a</span>
              <input
                name={`endTime_${rule.dayOfWeek}`}
                type="time"
                defaultValue={rule.endTime}
                disabled={!isActive}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none disabled:opacity-50"
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2">
        <AvailabilitySubmitButton
          scopeValue="week"
          idleLabel="Guardar horarios"
          pendingLabel="Guardando..."
          className="h-10 text-sm"
        />
      </div>
    </form>
  );
}
