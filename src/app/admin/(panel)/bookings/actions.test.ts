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

function futureDateString(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(20);
  return d.toISOString().slice(0, 10);
}

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
    const bookingDate = futureDateString();
    createSupabasePublicBookingMock.mockResolvedValue("booking_new");

    const { createManualBookingAction } = await import("./actions");
    const formData = new FormData();
    formData.set("serviceId", "svc_1");
    formData.set("bookingDate", bookingDate);
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
        bookingDate,
        startTime: "10:00",
        fullName: "Juan Perez",
        phone: "1122334455",
        email: "juan@example.com",
        initialStatus: "confirmed",
      })
    );
  });

  it("serializes concurrent reschedules so only one wins the same slot", async () => {
    const service = { id: "svc_1", business_id: "biz_123", name: "Corte", durationMinutes: 30 };
    const bookings: Record<string, { id: string; business_id: string; bookingDate: string; startTime: string; endTime: string; status: string; notes: string; service: typeof service }> = {
      booking_A: {
        id: "booking_A",
        business_id: "biz_123",
        bookingDate: "2026-03-24",
        startTime: "09:00",
        endTime: "09:30",
        status: "confirmed",
        notes: "",
        service,
      },
      booking_B: {
        id: "booking_B",
        business_id: "biz_123",
        bookingDate: "2026-03-24",
        startTime: "10:00",
        endTime: "10:30",
        status: "confirmed",
        notes: "",
        service,
      },
    };
    const allDayRules = Array.from({ length: 7 }, (_, i) => ({
      id: `rule_${i}`,
      business_id: "biz_123",
      dayOfWeek: i,
      startTime: "00:00",
      endTime: "23:59",
      active: true,
    }));

    getSupabaseRecordMock.mockImplementation(async (_table: string, id: string) => bookings[id]);
    listSupabaseRecordsMock.mockImplementation(async (table: string) => {
      if (table === "availability_rules") return allDayRules;
      if (table === "blocked_slots") return [];
      if (table === "bookings") return Object.values(bookings);
      return [];
    });
    updateSupabaseRecordMock.mockImplementation(
      async (_table: string, id: string, patch: Partial<(typeof bookings)["booking_A"]>) => {
        const next = { ...bookings[id]!, ...patch };
        if (patch.startTime) {
          const [h, m] = patch.startTime.split(":").map(Number);
          const endMinutes = h! * 60 + m! + next.service.durationMinutes;
          next.endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        }
        bookings[id] = next;
        return bookings[id];
      }
    );

    const { updateBookingAction } = await import("./actions");

    const buildFormData = (bookingId: string) => {
      const formData = new FormData();
      formData.set("bookingId", bookingId);
      formData.set("bookingDate", "2026-03-25");
      formData.set("startTime", "11:00");
      formData.set("status", "confirmed");
      formData.set("notes", "");
      return formData;
    };

    const results = await Promise.allSettled([
      updateBookingAction(buildFormData("booking_A")),
      updateBookingAction(buildFormData("booking_B")),
    ]);

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => String(r.reason));

    const redirects = errors.filter((message) => message.startsWith("Error: REDIRECT:"));
    const conflicts = errors.filter((message) => message.includes("Ese horario ya no esta disponible."));

    expect(redirects).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
  });
});
