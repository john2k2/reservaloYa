import { describe, expect, it } from "vitest";

import { publicBookingSchema } from "./booking";

/** Un año desde hoy, primer día del mes, para que el test nunca expire. */
function futureDateString(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

describe("publicBookingSchema", () => {
  it("accepts PocketBase booking ids for reschedules", () => {
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
});
