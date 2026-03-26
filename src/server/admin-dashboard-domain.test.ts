import { describe, expect, it } from "vitest";

import {
  buildAdminBusinessOptionsView,
  buildAdminDashboardBookingPreview,
  buildAdminDashboardMetrics,
  buildAdminDashboardNotifications,
  buildAdminDashboardView,
  buildAdminShellView,
} from "@/server/admin-dashboard-domain";

describe("admin dashboard domain", () => {
  it("sorts business options and normalizes template slug", () => {
    expect(
      buildAdminBusinessOptionsView([
        { slug: "b", name: "Beta", templateSlug: null },
        { slug: "a", name: "Alpha", templateSlug: "custom-a" },
      ])
    ).toEqual([
      { slug: "a", name: "Alpha", templateSlug: "custom-a" },
      { slug: "b", name: "Beta", templateSlug: "b" },
    ]);
  });

  it("builds shell and dashboard booking previews consistently", () => {
    const shell = buildAdminShellView({
      demoMode: true,
      profileName: "Demo Owner",
      businessName: "Barberia",
      businessSlug: "demo-barberia",
      userEmail: "demo@test.com",
      businessOptions: [{ slug: "b", name: "Beta", templateSlug: null }],
    });

    const bookings = buildAdminDashboardBookingPreview(
      [
        {
          id: "booking-2",
          customerName: "Bruno",
          serviceName: "Barba",
          bookingDate: "2026-03-28",
          startTime: "12:00",
          status: "confirmed",
        },
        {
          id: "booking-1",
          customerName: "Ana",
          serviceName: "Corte",
          bookingDate: "2026-03-27",
          startTime: "09:00",
          status: "pending",
        },
      ],
      (status) => status.toUpperCase()
    );

    expect(shell.businessOptions).toEqual([{ slug: "b", name: "Beta", templateSlug: "b" }]);
    expect(bookings.map((item) => item.id)).toEqual(["booking-1", "booking-2"]);
    expect(bookings[0]?.status).toBe("PENDING");
  });

  it("builds dashboard metrics, notifications and final view", () => {
    const metrics = buildAdminDashboardMetrics({
      visits: 10,
      ctaClicks: 4,
      bookingsCreated: 2,
      conversionRate: 20,
      pendingBookings: 1,
      customersCount: 7,
      customersHint: "Clientes guardados",
      topCampaignLabel: "Campana principal",
      hasVisits: true,
    });

    const notifications = buildAdminDashboardNotifications({
      pendingBookings: 1,
      remindersPending: 2,
      remindersProviderReady: false,
      bookingsCreated: 2,
      visits: 10,
      topSource: "instagram",
    });

    const view = buildAdminDashboardView({
      profileName: "Owner",
      businessName: "Barberia",
      businessSlug: "demo-barberia",
      userEmail: "owner@test.com",
      demoMode: false,
      metrics,
      bookings: [],
      analytics: { visits: 10 },
      reminders: { pending: 2 },
      notifications,
    });

    expect(metrics[0]).toMatchObject({
      label: "Visitas publicas",
      value: "10",
      hint: "4 clics en reservar",
    });
    expect(notifications).toEqual([
      "1 turnos pendientes de confirmar",
      "2 recordatorios listos cuando actives email o WhatsApp",
      "2 reservas llegaron desde la web",
      "Canal principal: instagram",
    ]);
    expect(view.businessSlug).toBe("demo-barberia");
  });
});
