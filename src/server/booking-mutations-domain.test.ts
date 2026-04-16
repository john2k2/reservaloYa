import { describe, expect, it } from "vitest";

import {
  buildBookingCustomerDetails,
  buildBookingMutationFields,
  buildBookingTimeWindow,
  canMutatePublicBooking,
  fitsBookingWithinAvailability,
  hasBlockedSlotConflict,
  hasBookingConflict,
} from "@/server/booking-mutations-domain";

describe("booking mutations domain", () => {
  it("builds booking time windows and mutation fields consistently", () => {
    expect(buildBookingTimeWindow("09:30", 45)).toEqual({
      startMinutes: 570,
      endTime: "10:15",
      endMinutes: 615,
    });

    expect(
      buildBookingMutationFields({
        bookingDate: "2026-03-30",
        startTime: "09:30",
        durationMinutes: 45,
        status: "pending_payment",
        notes: "Prefiere efectivo si falla MP",
        paymentPreferenceId: "pref-123",
      })
    ).toMatchObject({
      bookingDate: "2026-03-30",
      startTime: "09:30",
      endTime: "10:15",
      status: "pending_payment",
      notes: "Prefiere efectivo si falla MP",
      paymentProvider: "mercadopago",
      paymentPreferenceId: "pref-123",
      paymentStatus: "pending",
    });
  });

  it("detects availability, blocked slots and booking conflicts", () => {
    const window = buildBookingTimeWindow("10:00", 30);

    expect(
      fitsBookingWithinAvailability(
        [
          { startTime: "09:00", endTime: "12:00" },
          { startTime: "14:00", endTime: "18:00" },
        ],
        window
      )
    ).toBe(true);

    expect(
      hasBlockedSlotConflict([{ startTime: "10:15", endTime: "10:45" }], window)
    ).toBe(true);

    expect(
      hasBookingConflict(
        [
          {
            id: "booking-1",
            status: "confirmed",
            startTime: "09:30",
            endTime: "10:15",
          },
          {
            id: "booking-2",
            status: "cancelled",
            startTime: "10:00",
            endTime: "10:30",
          },
        ],
        {
          startMinutes: window.startMinutes,
          endMinutes: window.endMinutes,
          allowedStatuses: ["pending", "pending_payment", "confirmed"],
        }
      )
    ).toBe(true);

    expect(
      hasBookingConflict(
        [
          {
            id: "booking-2",
            status: "confirmed",
            startTime: "10:00",
            endTime: "10:30",
          },
        ],
        {
          startMinutes: window.startMinutes,
          endMinutes: window.endMinutes,
          allowedStatuses: ["pending", "confirmed"],
          excludeBookingId: "booking-2",
        }
      )
    ).toBe(false);
  });

  it("builds customer details with fallback values", () => {
    expect(
      buildBookingCustomerDetails(
        {
          fullName: "Ana Perez",
          email: "ana@test.com",
        },
        {
          phone: "11-1234-5678",
          email: "viejo@test.com",
          notes: "Cliente frecuente",
        }
      )
    ).toEqual({
      fullName: "Ana Perez",
      phone: "11-1234-5678",
      email: "ana@test.com",
      notes: "Cliente frecuente",
    });
  });

  it("allows only mutable public booking statuses", () => {
    expect(canMutatePublicBooking("pending")).toBe(true);
    expect(canMutatePublicBooking("pending_payment")).toBe(true);
    expect(canMutatePublicBooking("confirmed")).toBe(true);
    expect(canMutatePublicBooking("completed")).toBe(false);
    expect(canMutatePublicBooking("cancelled")).toBe(false);
    expect(canMutatePublicBooking("no_show")).toBe(false);
  });
});
