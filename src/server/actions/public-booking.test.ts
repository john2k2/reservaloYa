import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const createLocalPublicBookingMock = vi.fn(async () => "booking-test-id");

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.11" })),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

vi.mock("@/server/local-store", () => ({
  createLocalPublicBooking: createLocalPublicBookingMock,
  cancelLocalPublicBooking: vi.fn(),
}));

vi.mock("@/server/pocketbase-store", () => ({
  createPocketBasePublicBooking: vi.fn(),
  reschedulePocketBasePublicBooking: vi.fn(),
  cancelPocketBasePublicBooking: vi.fn(),
}));

vi.mock("@/server/analytics", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

vi.mock("@/server/booking-notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
}));

vi.mock("@/server/queries/public", () => ({
  getBookingConfirmationData: vi.fn(async () => null),
  getPublicBusinessPageData: vi.fn(async () => ({
    business: { name: "Demo Barberia", slug: "demo-barberia" },
    services: [{ id: "service-1", name: "Corte", price: 500 }],
    features: { bookingMaxDaysAhead: 30, bookingLockMinutes: 10 },
  })),
}));

vi.mock("@/server/public-booking-links", () => ({
  isValidBookingManageToken: vi.fn(() => true),
}));

function buildBookingFormData() {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("serviceId", "service-1");
  formData.set("bookingDate", "2026-03-25");
  formData.set("startTime", "10:00");
  formData.set("fullName", "Cliente Test");
  formData.set("phone", "1133344455");
  formData.set("email", "cliente@example.com");
  formData.set("notes", "");
  formData.set("rescheduleBookingId", "");
  formData.set("manageToken", "");
  formData.set("source", "instagram");
  formData.set("medium", "social");
  formData.set("campaign", "promo-marzo");
  return formData;
}

describe("public booking action rate limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    createLocalPublicBookingMock.mockClear();
  });

  it("shows a friendly throttle message after repeated submits", async () => {
    const { createPublicBookingAction } = await import("./public-booking");
    const redirectedUrls: string[] = [];

    for (let index = 0; index < 9; index += 1) {
      try {
        await createPublicBookingAction(buildBookingFormData());
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    expect(redirectedUrls[7]).toContain("/confirmacion?booking=booking-test-id");
    const rateLimitedUrl = new URL(redirectedUrls[8] ?? "", "http://localhost");
    expect(rateLimitedUrl.searchParams.get("error")).toContain("Demasiados intentos de reserva");
  });
});
