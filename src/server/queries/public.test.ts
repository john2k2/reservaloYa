import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseBookingConfirmationDataMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  unstable_noStore: vi.fn(),
}));

vi.mock("@/server/supabase-store", () => ({
  getSupabaseBookingConfirmationData: getSupabaseBookingConfirmationDataMock,
}));

describe("getBookingConfirmationData", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseBookingConfirmationDataMock.mockReset();
  });

  it("returns null when no bookingId is provided", async () => {
    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: undefined,
      })
    ).resolves.toBeNull();
  });

  it("returns confirmation data for valid booking", async () => {
    const mockData = {
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
      customerName: "John Doe",
    };

    getSupabaseBookingConfirmationDataMock.mockResolvedValue(mockData);

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "valid-token",
      })
    ).resolves.toEqual(mockData);

    expect(getSupabaseBookingConfirmationDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      bookingId: "booking-1",
    });
  });

  it("returns null when booking not found", async () => {
    getSupabaseBookingConfirmationDataMock.mockResolvedValue(null);

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "non-existent",
      })
    ).resolves.toBeNull();
  });
});