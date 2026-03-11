import { describe, expect, it } from "vitest";

import { publicBookingSchema } from "./booking";

describe("publicBookingSchema", () => {
  it("accepts PocketBase booking ids for reschedules", () => {
    const parsed = publicBookingSchema.safeParse({
      businessSlug: "demo-barberia",
      serviceId: "afdkwzm04yk2mc6",
      bookingDate: "2026-03-11",
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
