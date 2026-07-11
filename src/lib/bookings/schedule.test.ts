import { describe, expect, it } from "vitest";

import {
  buildWeeklySchedule,
  getActiveDaysFromWeeklyHours,
} from "@/lib/bookings/schedule";
import { getDayOfWeek, findNextBookingDate } from "@/lib/bookings/format";

describe("buildWeeklySchedule", () => {
  it("always returns 7 days with dayOfWeek 0-6", () => {
    const schedule = buildWeeklySchedule([
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 5, startTime: "10:00", endTime: "20:00" },
    ]);

    expect(schedule).toHaveLength(7);
    expect(schedule.map((d) => d.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(schedule[0]).toMatchObject({ dayLabel: "Domingo", hoursLabel: "Cerrado" });
    expect(schedule[1]).toMatchObject({
      dayLabel: "Lunes",
      hoursLabel: "09:00 a 18:00",
    });
    expect(schedule[3]).toMatchObject({ dayLabel: "Miércoles" });
    expect(schedule[5]).toMatchObject({
      dayLabel: "Viernes",
      hoursLabel: "10:00 a 20:00",
    });
  });
});

describe("getActiveDaysFromWeeklyHours", () => {
  it("returns JS getDay indices for open days (not array indexes of sparse lists)", () => {
    const schedule = buildWeeklySchedule([
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 5, startTime: "10:00", endTime: "20:00" },
    ]);

    const activeDays = getActiveDaysFromWeeklyHours(schedule);
    expect(activeDays).toEqual([1, 3, 5]);

    // Saturday Jul 11 2026 → next open day must be Monday Jul 13, not Sunday
    expect(findNextBookingDate("2026-07-11", activeDays)).toBe("2026-07-13");
    expect(getDayOfWeek("2026-07-13")).toBe(1);
  });

  it("falls back to index when dayOfWeek is missing (legacy)", () => {
    const legacy = [
      { hoursLabel: "09:00 a 18:00" },
      { hoursLabel: "Cerrado" },
      { hoursLabel: "10:00 a 14:00" },
    ];
    expect(getActiveDaysFromWeeklyHours(legacy)).toEqual([0, 2]);
  });
});
