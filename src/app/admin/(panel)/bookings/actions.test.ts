import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  updateLocalAdminBookingMock,
  getLocalAdminSettingsDataMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  updateLocalAdminBookingMock: vi.fn(),
  getLocalAdminSettingsDataMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

vi.mock("@/server/local-admin-context", () => ({
  getLocalActiveBusinessSlug: vi.fn(async () => "demo-barberia"),
}));

vi.mock("@/server/local-store", () => ({
  updateLocalAdminBooking: updateLocalAdminBookingMock,
  getLocalAdminSettingsData: getLocalAdminSettingsDataMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  updatePocketBaseAdminBooking: vi.fn(),
  getPocketBaseAdminSettingsData: vi.fn(),
}));

vi.mock("@/server/pocketbase-auth", () => ({
  getAuthenticatedPocketBaseUser: vi.fn(),
}));

describe("admin bookings actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    updateLocalAdminBookingMock.mockReset();
    getLocalAdminSettingsDataMock.mockReset();
    revalidatePathMock.mockReset();

    getLocalAdminSettingsDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
  });

  it("rejects invalid booking edits", async () => {
    const { updateBookingAction } = await import("./actions");
    const formData = new FormData();
    formData.set("bookingId", "");
    formData.set("bookingDate", "bad-date");
    formData.set("startTime", "");
    formData.set("status", "wrong");
    formData.set("notes", "nota");

    await expect(updateBookingAction(formData)).rejects.toThrow(
      "Revisa el estado y las notas antes de guardar."
    );
    expect(updateLocalAdminBookingMock).not.toHaveBeenCalled();
  });

  it("updates a local booking and preserves filters on redirect", async () => {
    updateLocalAdminBookingMock.mockResolvedValue("booking_1");

    const { updateBookingAction } = await import("./actions");
    const formData = new FormData();
    formData.set("bookingId", "booking_1");
    formData.set("bookingDate", "2026-03-20");
    formData.set("startTime", "10:00");
    formData.set("status", "confirmed");
    formData.set("notes", "Cliente confirmado");
    formData.set("redirectStatus", "pending");
    formData.set("redirectDate", "2026-03-20");
    formData.set("redirectQ", "Juan");

    await expect(updateBookingAction(formData)).rejects.toThrow("REDIRECT:");
    expect(updateLocalAdminBookingMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      bookingId: "booking_1",
      bookingDate: "2026-03-20",
      startTime: "10:00",
      status: "confirmed",
      notes: "Cliente confirmado",
    });
    expect(String(redirectMock.mock.calls.at(-1)?.[0] ?? "")).toContain(
      "/admin/bookings?saved=booking_1&status=pending&date=2026-03-20&q=Juan"
    );
  });
});
