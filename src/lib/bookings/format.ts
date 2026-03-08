export function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function parseTimeParts(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

export function getDayOfWeek(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

export function addDays(date: string, amount: number) {
  const baseDate = new Date(`${date}T12:00:00Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() + amount);
  return baseDate.toISOString().slice(0, 10);
}

export function findNextBookingDate(baseDate: string, activeDays: number[]) {
  if (activeDays.length === 0) {
    return baseDate;
  }

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = addDays(baseDate, offset);

    if (activeDays.includes(getDayOfWeek(candidate))) {
      return candidate;
    }
  }

  return baseDate;
}

export function buildBookingDateOptions(baseDate: string, activeDays: number[], total = 6) {
  if (activeDays.length === 0) {
    return [baseDate];
  }

  const options: string[] = [];

  for (let offset = 0; offset < 21 && options.length < total; offset += 1) {
    const candidate = addDays(baseDate, offset);

    if (activeDays.includes(getDayOfWeek(candidate))) {
      options.push(candidate);
    }
  }

  return options.length > 0 ? options : [baseDate];
}

export function formatDateLabel(date: string) {
  const { year, month, day } = parseDateParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(utcDate);
}

export function formatShortDateLabel(date: string) {
  const { year, month, day } = parseDateParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(utcDate);
}

export function formatTimeLabel(time: string) {
  const { hours, minutes } = parseTimeParts(time);
  const utcDate = new Date(Date.UTC(2026, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(utcDate);
}

export function addMinutes(time: string, minutesToAdd: number) {
  const { hours, minutes } = parseTimeParts(time);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}
