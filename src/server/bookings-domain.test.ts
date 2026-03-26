import { describe, expect, it } from "vitest";

import {
  buildBookingConfirmationView,
  buildBookingStartsAt,
  buildManageBookingView,
} from "@/server/bookings-domain";

describe("bookings domain helpers", () => {
  it("builds startsAt from booking date and start time", () => {
    expect(buildBookingStartsAt("2026-03-30", "10:30")).toMatch(/^2026-03-30T13:30:00\.000Z|2026-03-30T10:30:00\.000Z/);
  });

  it("builds a normalized booking confirmation view", () => {
    const view = buildBookingConfirmationView({
      bookingId: "booking-12345678",
      businessId: "biz-1",
      businessName: "Demo Barberia",
      businessSlug: "demo-barberia",
      businessAddress: "Calle Falsa 123",
      businessTimezone: "America/Argentina/Buenos_Aires",
      bookingDate: "2026-03-30",
      startTime: "10:30",
      status: "confirmed",
      source: "local",
    });

    expect(view).toMatchObject({
      bookingId: "booking-12345678",
      confirmationCode: "BOOKING-",
      customerName: "Cliente",
      serviceName: "Servicio",
      durationMinutes: 60,
      currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      source: "local",
    });
  });

  it("builds a normalized manage booking view", () => {
    const view = buildManageBookingView({
      id: "booking-1",
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      businessTimezone: "America/Argentina/Buenos_Aires",
      bookingDate: "2026-03-30",
      startTime: "10:30",
      status: "pending",
      statusLabel: "Pendiente",
    });

    expect(view).toMatchObject({
      id: "booking-1",
      businessAddress: "",
      serviceName: "Servicio",
      durationMinutes: 60,
      fullName: "",
      phone: "",
      email: "",
      notes: "",
      statusLabel: "Pendiente",
    });
  });
});
