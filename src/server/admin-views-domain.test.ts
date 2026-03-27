import { describe, expect, it } from "vitest";

import {
  buildAdminAvailabilityView,
  buildAdminBookingsView,
  buildAdminCustomersView,
  buildAdminServicesView,
  buildAdminSettingsView,
} from "@/server/admin-views-domain";

describe("admin views domain", () => {
  it("builds and filters admin bookings consistently", () => {
    const view = buildAdminBookingsView(
      [
        {
          id: "booking-2",
          customerName: "Bruno",
          phone: "222",
          serviceName: "Barba",
          bookingDate: "2026-03-28",
          startTime: "12:00",
          status: "confirmed",
          notes: "",
        },
        {
          id: "booking-1",
          customerName: "Ana",
          phone: "111",
          serviceName: "Corte",
          bookingDate: "2026-03-27",
          startTime: "09:00",
          status: "pending",
          notes: "Primera visita",
        },
      ],
      { status: "pending", q: "ana" },
      (status) => `label:${status}`
    );

    expect(view).toEqual([
      {
        id: "booking-1",
        customerName: "Ana",
        phone: "111",
        serviceName: "Corte",
        bookingDate: "2026-03-27",
        startTime: "09:00",
        status: "pending",
        statusLabel: "label:pending",
        notes: "Primera visita",
      },
    ]);
  });

  it("builds customer rows with booking counters and last booking date", () => {
    const view = buildAdminCustomersView(
      [
        {
          id: "cust-1",
          fullName: "Ana",
          phone: "111",
          email: "ana@test.com",
          notes: "VIP",
          createdAt: "2026-03-20T10:00:00.000Z",
        },
        {
          id: "cust-2",
          fullName: "Bruno",
          phone: "222",
          email: "bruno@test.com",
          notes: "",
          createdAt: "2026-03-19T10:00:00.000Z",
        },
      ],
      [
        { customerId: "cust-1", bookingDate: "2026-03-28", startTime: "10:00" },
        { customerId: "cust-1", bookingDate: "2026-03-29", startTime: "11:00" },
        { customerId: "cust-2", bookingDate: "2026-03-27", startTime: "09:00" },
      ],
      "ana"
    );

    expect(view).toEqual([
      {
        id: "cust-1",
        fullName: "Ana",
        phone: "111",
        email: "ana@test.com",
        notes: "VIP",
        bookingsCount: 2,
        lastBookingDate: "2026-03-29",
      },
    ]);
  });

  it("sorts services by featured first and formats price labels", () => {
    const view = buildAdminServicesView(
      [
        {
          id: "svc-2",
          name: "Corte",
          description: "",
          durationMinutes: 45,
          price: 12000,
          featured: false,
          featuredLabel: "",
        },
        {
          id: "svc-1",
          name: "Barba",
          description: "",
          durationMinutes: 30,
          price: 8000,
          featured: true,
          featuredLabel: "Top",
        },
      ],
      (price) => `ARS ${price}`
    );

    expect(view.map((item) => item.id)).toEqual(["svc-1", "svc-2"]);
    expect(view[0]?.priceLabel).toBe("ARS 8000");
  });

  it("normalizes availability and settings projections", () => {
    const availability = buildAdminAvailabilityView(
      [
        {
          id: "rule-2",
          businessId: "biz-1",
          dayOfWeek: 3,
          startTime: "12:00",
          endTime: "18:00",
          active: true,
        },
        {
          id: "rule-1",
          businessId: "biz-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          active: true,
        },
      ],
      [
        {
          id: "block-1",
          businessId: "biz-1",
          blockedDate: "2026-03-29",
          startTime: "15:00",
          endTime: "16:00",
          reason: null,
        },
      ]
    );

    const settings = buildAdminSettingsView(
      {
        name: "Barberia Libertador",
        slug: "demo-barberia",
        templateSlug: null,
        phone: null,
        email: null,
        address: null,
        timezone: null,
        cancellationPolicy: null,
        mpConnected: null,
        mpCollectorId: null,
      },
      { heroTitle: "Hero" }
    );

    expect(availability.rules.map((rule) => rule.id)).toEqual(["rule-1", "rule-2"]);
    expect(availability.blockedSlots[0]?.reason).toBe("");
    expect(settings).toMatchObject({
      businessName: "Barberia Libertador",
      businessSlug: "demo-barberia",
      templateSlug: "demo-barberia",
      phone: "",
      email: "",
      address: "",
      timezone: "America/Argentina/Buenos_Aires",
      publicUrl: "/demo-barberia",
      mpConnected: false,
    });
  });
});
