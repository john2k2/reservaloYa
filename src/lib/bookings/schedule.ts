const weekdayLabels = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export function buildWeeklySchedule(
  rules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
) {
  const grouped = new Map<number, string[]>();

  for (const rule of rules) {
    const current = grouped.get(rule.dayOfWeek) ?? [];
    current.push(`${rule.startTime} a ${rule.endTime}`);
    grouped.set(rule.dayOfWeek, current);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([dayOfWeek, windows]) => ({
      dayLabel: weekdayLabels[dayOfWeek] ?? "Dia",
      hoursLabel: windows.join(" · "),
    }));
}
