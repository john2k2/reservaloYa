import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, requireAdminRouteAccessMock, runSupabaseBookingReminderSweepMock } = vi.hoisted(
  () => ({
    redirectMock: vi.fn((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    }),
    requireAdminRouteAccessMock: vi.fn(),
    runSupabaseBookingReminderSweepMock: vi.fn(),
  })
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

vi.mock("@/server/admin-access", () => ({
  requireAdminRouteAccess: requireAdminRouteAccessMock,
}));

vi.mock("@/server/supabase-store", () => ({
  runSupabaseBookingReminderSweep: runSupabaseBookingReminderSweepMock,
}));

describe("runLocalReminderSweepAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    requireAdminRouteAccessMock.mockReset();
    runSupabaseBookingReminderSweepMock.mockReset();

    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      businessSlug: "demo-barberia",
      demoMode: false,
      userRole: "owner",
      userEmail: "owner@example.com",
    });
  });

  it("propagates the success redirect instead of turning it into the generic error", async () => {
    runSupabaseBookingReminderSweepMock.mockResolvedValue({ sent: 2, candidates: 2 });

    const { runLocalReminderSweepAction } = await import("./actions");

    await expect(runLocalReminderSweepAction()).rejects.toThrow(
      "REDIRECT:/admin/dashboard?reminders="
    );
  });
});
