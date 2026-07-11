const weekdayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type WeeklyHourSlot = {
  dayOfWeek: number;
  dayLabel: string;
  hoursLabel: string;
};

/**
 * Always returns the 7 days of the week (JS dayOfWeek: 0=Sun … 6=Sat).
 * Days without rules are labeled "Cerrado" so consumers can use either
 * `dayOfWeek` or array index interchangeably.
 */
export function buildWeeklySchedule(
  rules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): WeeklyHourSlot[] {
  const grouped = new Map<number, string[]>();

  for (const rule of rules) {
    const current = grouped.get(rule.dayOfWeek) ?? [];
    current.push(`${rule.startTime} a ${rule.endTime}`);
    grouped.set(rule.dayOfWeek, current);
  }

  return weekdayLabels.map((dayLabel, dayOfWeek) => {
    const windows = grouped.get(dayOfWeek);
    return {
      dayOfWeek,
      dayLabel,
      hoursLabel: windows && windows.length > 0 ? windows.join(" · ") : "Cerrado",
    };
  });
}

/** Active weekdays as JS getDay() indices (0=Sun … 6=Sat). */
export function getActiveDaysFromWeeklyHours(
  weeklyHours: Array<{ dayOfWeek?: number; hoursLabel: string }>
): number[] {
  return weeklyHours
    .map((slot, index) => ({
      dayOfWeek: typeof slot.dayOfWeek === "number" ? slot.dayOfWeek : index,
      hoursLabel: slot.hoursLabel,
    }))
    .filter((slot) => !slot.hoursLabel.toLocaleLowerCase("es-AR").includes("cerrado"))
    .map((slot) => slot.dayOfWeek);
}
