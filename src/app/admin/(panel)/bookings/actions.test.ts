import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  getAuthenticatedSupabaseUserMock,
  getSupabaseRecordMock,
  updateSupabaseRecordMock,
  listSupabaseRecordsMock,
  createSupabasePublicBookingMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
  getAuthenticatedSupabaseUserMock: vi.fn(),
  getSupabaseRecordMock: vi.fn(),
  updateSupabaseRecordMock: vi.fn(),
  listSupabaseRecordsMock: vi.fn(),
  createSupabasePublicBookingMock: vi.fn(),
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

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/server/supabase-store", () => ({
  createSupabasePublicBooking: createSupabasePublicBookingMock,
}));

vi.mock("@/server/supabase-store/_core", () => ({
  getSupabaseRecord: getSupabaseRecordMock,
  updateSupabaseRecord: updateSupabaseRecordMock,
  listSupabaseRecords: listSupabaseRecordsMock,
}));

describe("admin bookings actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    getAuthenticatedSupabaseUserMock.mockReset();
    getSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
    listSupabaseRecordsMock.mockReset();
    createSupabasePublicBookingMock.mockReset();

    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "user_1",
      businessId: "biz_123",
      businessSlug: "demo-barberia",
      role: "owner",
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
    expect(updateSupabaseRecordMock).not.toHaveBeenCalled();
  });

  it("updates a booking and preserves filters on redirect", async () => {
    const booking = {
      id: "booking_1",
      business_id: "biz_123",
      bookingDate: "2026-03-20",
      startTime: "10:00",
      status: "pending",
      notes: "",
      service: { id: "svc_1", business_id: "biz_123", durationMinutes: 30 },
    };
    getSupabaseRecordMock.mockResolvedValue(booking);
    const mockRules = Array.from({ length: 7 }, (_, i) => ({
      id: `rule_${i}`,
      business_id: "biz_123",
      dayOfWeek: i,
      startTime: "00:00",
      endTime: "23:59",
      active: true,
    }));
    listSupabaseRecordsMock
      .mockResolvedValueOnce(mockRules)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    updateSupabaseRecordMock.mockResolvedValue(booking);

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
    expect(updateSupabaseRecordMock).toHaveBeenCalledWith("bookings", "booking_1", expect.any(Object));
    expect(String(redirectMock.mock.calls.at(-1)?.[0] ?? "")).toContain(
      "/admin/bookings?saved=booking_1&status=pending&date=2026-03-20&q=Juan"
    );
  });

  it("creates a manual booking and redirects", async () => {
    createSupabasePublicBookingMock.mockResolvedValue("booking_new");

    const { createManualBookingAction } = await import("./actions");
    const formData = new FormData();
    formData.set("serviceId", "svc_1");
    formData.set("bookingDate", "2026-03-20");
    formData.set("startTime", "10:00");
    formData.set("fullName", "Juan Perez");
    formData.set("phone", "1122334455");
    formData.set("email", "juan@example.com");
    formData.set("businessSlug", "demo-barberia");

    await expect(createManualBookingAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createSupabasePublicBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessSlug: "demo-barberia",
        serviceId: "svc_1",
        bookingDate: "2026-03-20",
        startTime: "10:00",
        fullName: "Juan Perez",
        phone: "1122334455",
        email: "juan@example.com",
        initialStatus: "confirmed",
      })
    );
  });
});