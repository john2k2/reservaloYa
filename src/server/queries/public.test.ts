import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBookingConfirmationToken,
  createBookingManageToken,
} from "@/server/public-booking-links";

const getSupabaseBookingConfirmationDataMock = vi.fn();
const getSupabaseManageBookingDataMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  unstable_noStore: vi.fn(),
}));

vi.mock("@/server/supabase-store", () => ({
  getSupabaseBookingConfirmationData: getSupabaseBookingConfirmationDataMock,
  getSupabasePublicBusinessPageData: vi.fn(),
  getSupabasePublicBookingFlowData: vi.fn(),
  getSupabaseManageBookingData: getSupabaseManageBookingDataMock,
}));

describe("getBookingConfirmationData", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseBookingConfirmationDataMock.mockReset();
    process.env.ALLOW_DEV_SECRETS = "1";
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

  it("returns null when token is missing", async () => {
    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
      })
    ).resolves.toBeNull();
  });

  it("returns null when token is invalid", async () => {
    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "invalid-token",
      })
    ).resolves.toBeNull();
  });

  it("returns confirmation data for a valid token", async () => {
    const mockData = {
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
      customerName: "John Doe",
    };

    getSupabaseBookingConfirmationDataMock.mockResolvedValue(mockData);

    const { getBookingConfirmationData } = await import("./public");
    const token = createBookingConfirmationToken("demo-barberia", "booking-1");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token,
      })
    ).resolves.toEqual(mockData);

    expect(getSupabaseBookingConfirmationDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      bookingId: "booking-1",
    });
  });

  it("returns data when skipTokenValidation is true even without token", async () => {
    const mockData = {
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
    };

    getSupabaseBookingConfirmationDataMock.mockResolvedValue(mockData);

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        skipTokenValidation: true,
      })
    ).resolves.toEqual(mockData);
  });
});

describe("getPublicManageBookingData", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseManageBookingDataMock.mockReset();
    process.env.ALLOW_DEV_SECRETS = "1";
  });

  it("returns null when no bookingId is provided", async () => {
    const { getPublicManageBookingData } = await import("./public");

    await expect(
      getPublicManageBookingData({
        slug: "demo-barberia",
        bookingId: undefined,
      })
    ).resolves.toBeNull();
  });

  it("returns null when token is missing", async () => {
    const { getPublicManageBookingData } = await import("./public");

    await expect(
      getPublicManageBookingData({
        slug: "demo-barberia",
        bookingId: "booking-1",
      })
    ).resolves.toBeNull();
  });

  it("returns null when token is invalid", async () => {
    const { getPublicManageBookingData } = await import("./public");

    await expect(
      getPublicManageBookingData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "invalid-token",
      })
    ).resolves.toBeNull();
  });

  it("returns null when a confirmation token is used for manage", async () => {
    const { getPublicManageBookingData } = await import("./public");
    const confirmationToken = createBookingConfirmationToken(
      "demo-barberia",
      "booking-1"
    );

    await expect(
      getPublicManageBookingData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: confirmationToken,
      })
    ).resolves.toBeNull();
  });

  it("returns manage data for a valid manage token", async () => {
    const mockData = {
      id: "booking-1",
      businessSlug: "demo-barberia",
      fullName: "John Doe",
    };

    getSupabaseManageBookingDataMock.mockResolvedValue(mockData);

    const { getPublicManageBookingData } = await import("./public");
    const token = createBookingManageToken("demo-barberia", "booking-1");

    await expect(
      getPublicManageBookingData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token,
      })
    ).resolves.toEqual(mockData);

    expect(getSupabaseManageBookingDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      bookingId: "booking-1",
    });
  });
});
