"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { getAccentForeground } from "@/lib/color-contrast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DateOption {
  /** ISO date string yyyy-mm-dd */
  value: string;
  /** Next.js href to navigate when selected */
  href?: string;
  isSelected: boolean;
  isToday: boolean;
}

interface BookingDateTimePickerProps {
  accentColor: string;
  dateOptions: DateOption[];
  todayDate: string;
  /** Currently selected ISO date (yyyy-mm-dd) */
  selectedDate: string;
  selectedDateLabel: string;
  slots: string[];
  rescheduleStartTime?: string;
  onSelectDate?: (date: string) => void;
  onSelectSlot?: (slot: string) => void;
  isLoading?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1);
  const label = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Build calendar grid cells for a given month.  */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // JS getDay(): 0=Sun, convert to Mon-based 0=Mon
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];

  // Leading empties
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, dateStr: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push({ day: d, dateStr: `${year}-${mm}-${dd}` });
  }

  return cells;
}

function getSlotPeriod(slot: string): "morning" | "afternoon" | "evening" {
  const hour = parseInt(slot.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const PERIOD_LABELS: Record<string, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
};

function getDateAriaLabel(dateStr: string, input: { isAvailable: boolean; isSelected: boolean; isToday: boolean }) {
  const date = new Date(`${dateStr}T00:00:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const state = [
    input.isToday ? "hoy" : null,
    input.isSelected ? "fecha seleccionada" : null,
    input.isAvailable ? "con horarios disponibles" : "sin horarios disponibles",
  ].filter(Boolean);

  return `${label}, ${state.join(", ")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function BookingDateTimePicker({
  accentColor,
  dateOptions,
  todayDate,
  selectedDate,
  selectedDateLabel,
  slots,
  rescheduleStartTime,
  onSelectDate,
  onSelectSlot,
  isLoading = false,
}: BookingDateTimePickerProps) {
  // Available dates as a Set for fast lookup
  const availableDates = useMemo(
    () => new Set(dateOptions.map((d) => d.value)),
    [dateOptions],
  );

  const dateOptionMap = useMemo(() => {
    const map = new Map<string, DateOption>();
    for (const opt of dateOptions) {
      map.set(opt.value, opt);
    }
    return map;
  }, [dateOptions]);

  // Calendar state: which month we're viewing
  const initialYear = parseInt(selectedDate.slice(0, 4), 10);
  const initialMonth = parseInt(selectedDate.slice(5, 7), 10) - 1;
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = getMonthLabel(viewYear, viewMonth);

  const goToPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goToNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // Group slots by period
  const groupedSlots = useMemo(() => {
    const groups: Array<{ period: string; label: string; items: string[] }> = [];
    let currentPeriod = "";
    let currentItems: string[] = [];

    for (const slot of slots) {
      const period = getSlotPeriod(slot);
      if (period !== currentPeriod) {
        if (currentItems.length > 0) {
          groups.push({ period: currentPeriod, label: PERIOD_LABELS[currentPeriod], items: currentItems });
        }
        currentPeriod = period;
        currentItems = [slot];
      } else {
        currentItems.push(slot);
      }
    }
    if (currentItems.length > 0) {
      groups.push({ period: currentPeriod, label: PERIOD_LABELS[currentPeriod], items: currentItems });
    }
    return groups;
  }, [slots]);

  const hasSlots = slots.length > 0;
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const togglePeriod = (period: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(period)) {
        next.delete(period);
      } else {
        next.add(period);
      }
      return next;
    });
  };

  return (
    <div
      className="grid gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card/90 md:grid-cols-[1fr_minmax(0,18rem)]"
      style={{ ["--accent" as string]: accentColor }}
    >
      {/* ---- LEFT: Mini Calendar ---- */}
      <fieldset className="border-b border-border/60 p-5 sm:p-6 md:border-b-0 md:border-r">
        <legend className="sr-only">Elegí una fecha disponible</legend>
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h3 className="text-sm font-semibold text-foreground">{monthLabel}</h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mt-4 grid grid-cols-7 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 text-center">
          {grid.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const dateStr = cell.dateStr!;
            const isAvailable = availableDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayDate;
            const option = dateOptionMap.get(dateStr);
            const ariaLabel = getDateAriaLabel(dateStr, { isAvailable, isSelected, isToday });

            const selectedForeground = isSelected ? getAccentForeground(accentColor) : undefined;

            const cellContent = (
              <span
                className={cn(
                  "relative inline-flex size-10 items-center justify-center rounded-xl text-sm font-medium transition-all duration-200",
                  isSelected
                    ? "font-bold shadow-lg"
                    : isAvailable
                      ? "text-foreground hover:bg-muted/70"
                      : "cursor-default text-muted-foreground",
                  isToday && !isSelected && "ring-1 ring-foreground/20",
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: accentColor,
                        boxShadow: `0 4px 12px -2px ${accentColor}40`,
                        color: selectedForeground,
                      }
                    : undefined
                }
              >
                {cell.day}
                {isToday && (
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                      !isSelected && "bg-foreground/40",
                    )}
                    style={isSelected ? { backgroundColor: `${selectedForeground}b3` } : undefined}
                  />
                )}
              </span>
            );

            if (isAvailable && option && onSelectDate) {
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className="flex items-center justify-center rounded-xl py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                >
                  {cellContent}
                </button>
              );
            }

            if (isAvailable && option?.href) {
              return (
                <Link
                  key={dateStr}
                  href={option.href}
                  scroll={false}
                  className="flex items-center justify-center rounded-xl py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={ariaLabel}
                  aria-current={isSelected ? "date" : undefined}
                >
                  {cellContent}
                </Link>
              );
            }

            return (
              <div key={dateStr} className="flex items-center justify-center py-0.5">
                {cellContent}
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* ---- RIGHT: Time slots ---- */}
      <div className="flex flex-col p-5 sm:p-6">
        {/* Selected date header */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {selectedDateLabel}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
          {isLoading
            ? "Cargando horarios disponibles..."
            : hasSlots
            ? `${slots.length} ${slots.length === 1 ? "horario disponible" : "horarios disponibles"}`
            : "Sin horarios disponibles"}
        </p>

        {/* Slots list */}
        {isLoading ? (
          <div className="mt-4 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index}>
                <div className="mb-2 h-3 w-20 rounded-full bg-muted/70" />
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from({ length: 4 }).map((__, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="flex min-h-10 animate-pulse items-center justify-center rounded-lg border border-border/50 bg-muted/60"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : hasSlots ? (
          <fieldset className="mt-4 flex-1 space-y-4 overflow-y-auto" style={{ maxHeight: "20rem" }}>
            <legend className="sr-only">Elegí la hora del turno</legend>

            {/* Single style for checked state */}
            <style>{`
              .dt-picker-slot:has(:checked) > .dt-picker-slot-label {
                background-color: var(--accent);
                border-color: transparent;
                color: white;
                box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--accent) 40%, transparent);
              }
            `}</style>

            {groupedSlots.map((group) => {
              const isExpanded = expandedPeriods.has(group.period);
              const visibleSlots = isExpanded ? group.items : group.items.slice(0, 6);
              const hiddenCount = group.items.length - visibleSlots.length;
              return (
                <div key={group.period}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {visibleSlots.map((slot) => (
                      <label key={slot} className="dt-picker-slot cursor-pointer">
                        <input
                          type="radio"
                          name="startTime"
                          value={slot}
                          required
                          className="peer sr-only"
                          defaultChecked={rescheduleStartTime === slot}
                          aria-label={`Horario ${slot} para ${selectedDateLabel}`}
                          onChange={() => onSelectSlot?.(slot)}
                        />
                        <span className="dt-picker-slot-label flex min-h-10 items-center justify-center rounded-lg border border-border/60 bg-background/85 text-[13px] font-semibold tabular-nums text-foreground transition-[transform,opacity,border-color,background-color] duration-150 hover:border-foreground/20 hover:bg-card peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background active:scale-[0.96]">
                          {slot}
                        </span>
                      </label>
                    ))}
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => togglePeriod(group.period)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/85 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    >
                      Mostrar {hiddenCount} horario{hiddenCount === 1 ? "" : "s"} más
                      <ChevronDown className="size-3.5" />
                    </button>
                  )}
                  {isExpanded && group.items.length > 6 && (
                    <button
                      type="button"
                      onClick={() => togglePeriod(group.period)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/85 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    >
                      Mostrar menos
                      <ChevronDown className="size-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              );
            })}
          </fieldset>
        ) : (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
              <Clock3 className="mb-3 size-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Sin horarios</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Probá seleccionando otro día en el calendario.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
