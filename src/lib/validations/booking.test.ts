import { describe, expect, it } from "vitest";

import { bookingDateSchema, bookingTimeSchema, publicBookingSchema } from "./booking";

/** Un año desde hoy, primer día del mes, para que el test nunca expire. */
function futureDateString(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

describe("publicBookingSchema", () => {
  it("accepts persisted booking ids for reschedules", () => {
    const parsed = publicBookingSchema.safeParse({
      businessSlug: "demo-barberia",
      serviceId: "afdkwzm04yk2mc6",
      bookingDate: futureDateString(),
      startTime: "09:45",
      fullName: "QA Produccion ReservaYa",
      phone: "1155550101",
      email: "qa+prod-reservaya@example.com",
      notes: "Prueba end to end en produccion.",
      rescheduleBookingId: "9kg2gxn33ciruxz",
      manageToken:
        "eyJzbHVnIjoiZGVtby1iYXJiZXJpYSIsImJvb2tpbmdJZCI6IjlrZzJneG4zM2NpcnV4eiIsImV4cCI6MTc3NTgyNjI1ODUyNn0.i3hm58C_PxZTf5JiFuKyxAqxnAO9cDqtJ4lrnfQExms",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects calendar dates that do not exist", () => {
    const parsed = publicBookingSchema.safeParse({
      businessSlug: "demo-barberia",
      serviceId: "service-1",
      bookingDate: "2026-02-31",
      startTime: "09:45",
      fullName: "QA Produccion ReservaYa",
      phone: "1155550101",
      email: "qa@example.com",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects hours outside HH:MM clock range", () => {
    const parsed = publicBookingSchema.safeParse({
      businessSlug: "demo-barberia",
      serviceId: "service-1",
      bookingDate: futureDateString(),
      startTime: "24:00",
      fullName: "QA Produccion ReservaYa",
      phone: "1155550101",
      email: "qa@example.com",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects dates older than the timezone margin", () => {
    const oldDate = new Date();
    oldDate.setUTCDate(oldDate.getUTCDate() - 2);

    const parsed = publicBookingSchema.safeParse({
      businessSlug: "demo-barberia",
      serviceId: "service-1",
      bookingDate: oldDate.toISOString().slice(0, 10),
      startTime: "09:45",
      fullName: "QA Produccion ReservaYa",
      phone: "1155550101",
      email: "qa@example.com",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("booking date/time schemas", () => {
  it("validate real dates without enforcing past/future", () => {
    expect(bookingDateSchema.safeParse("2024-02-29").success).toBe(true);
    expect(bookingDateSchema.safeParse("2025-02-29").success).toBe(false);
  });

  it("validate real time ranges", () => {
    expect(bookingTimeSchema.safeParse("23:59").success).toBe(true);
    expect(bookingTimeSchema.safeParse("12:60").success).toBe(false);
  });
});
