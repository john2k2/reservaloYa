import { beforeEach, describe, expect, it, vi } from "vitest";

const isPocketBaseConfiguredMock = vi.fn(() => false);
const hasPocketBasePublicAuthCredentialsMock = vi.fn(() => false);
const isValidBookingConfirmationTokenMock = vi.fn(() => true);
const isValidBookingManageTokenMock = vi.fn(() => true);
const getLocalBookingConfirmationDataMock = vi.fn<() => Promise<unknown>>(async () => null);
const getLocalPublicBookingFlowDataMock = vi.fn(async () => null);
const getLocalPublicBusinessPageDataMock = vi.fn(async () => null);
const getLocalPublicManageBookingDataMock = vi.fn(async () => null);
const getPocketBaseBookingConfirmationDataMock = vi.fn<() => Promise<unknown>>(async () => null);
const getPocketBaseManageBookingDataMock = vi.fn(async () => null);
const getPocketBasePublicBookingFlowDataMock = vi.fn(async () => null);
const getPocketBasePublicBusinessPageDataMock = vi.fn(async () => null);

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  unstable_noStore: vi.fn(),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  hasPocketBasePublicAuthCredentials: hasPocketBasePublicAuthCredentialsMock,
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/server/public-booking-links", () => ({
  isValidBookingConfirmationToken: isValidBookingConfirmationTokenMock,
  isValidBookingManageToken: isValidBookingManageTokenMock,
}));

vi.mock("@/server/local-store", () => ({
  getLocalBookingConfirmationData: getLocalBookingConfirmationDataMock,
  getLocalPublicBookingFlowData: getLocalPublicBookingFlowDataMock,
  getLocalPublicBusinessPageData: getLocalPublicBusinessPageDataMock,
  getLocalPublicManageBookingData: getLocalPublicManageBookingDataMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  getPocketBaseBookingConfirmationData: getPocketBaseBookingConfirmationDataMock,
  getPocketBaseManageBookingData: getPocketBaseManageBookingDataMock,
  getPocketBasePublicBookingFlowData: getPocketBasePublicBookingFlowDataMock,
  getPocketBasePublicBusinessPageData: getPocketBasePublicBusinessPageDataMock,
}));

describe("getBookingConfirmationData", () => {
  beforeEach(() => {
    vi.resetModules();
    isPocketBaseConfiguredMock.mockReset();
    hasPocketBasePublicAuthCredentialsMock.mockReset();
    isValidBookingConfirmationTokenMock.mockReset();
    isValidBookingManageTokenMock.mockReset();
    getLocalBookingConfirmationDataMock.mockReset();
    getPocketBaseBookingConfirmationDataMock.mockReset();

    isPocketBaseConfiguredMock.mockReturnValue(false);
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(false);
    isValidBookingConfirmationTokenMock.mockReturnValue(true);
    isValidBookingManageTokenMock.mockReturnValue(true);
    getLocalBookingConfirmationDataMock.mockResolvedValue(null);
    getPocketBaseBookingConfirmationDataMock.mockResolvedValue(null);
  });

  it("devuelve null si el token de confirmación es inválido", async () => {
    isValidBookingConfirmationTokenMock.mockReturnValue(false);
    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "bad-token",
      })
    ).resolves.toBeNull();

    expect(getLocalBookingConfirmationDataMock).not.toHaveBeenCalled();
    expect(getPocketBaseBookingConfirmationDataMock).not.toHaveBeenCalled();
  });

  it("rechaza bookings de otro slug en modo local", async () => {
    getLocalBookingConfirmationDataMock.mockResolvedValue({
      bookingId: "booking-1",
      businessSlug: "otro-negocio",
    });

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "confirmation-token",
      })
    ).resolves.toBeNull();
  });

  it("permite uso interno sin token si se indica skipTokenValidation", async () => {
    getLocalBookingConfirmationDataMock.mockResolvedValue({
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
    });

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        skipTokenValidation: true,
      })
    ).resolves.toEqual({
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
    });

    expect(isValidBookingConfirmationTokenMock).not.toHaveBeenCalled();
  });

  it("usa fallback local si PocketBase está configurado pero faltan credenciales públicas", async () => {
    isPocketBaseConfiguredMock.mockReturnValue(true);
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(false);
    getLocalBookingConfirmationDataMock.mockResolvedValue({
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
    });

    const { getBookingConfirmationData } = await import("./public");

    await expect(
      getBookingConfirmationData({
        slug: "demo-barberia",
        bookingId: "booking-1",
        token: "confirmation-token",
      })
    ).resolves.toEqual({
      bookingId: "booking-1",
      businessSlug: "demo-barberia",
    });

    expect(getPocketBaseBookingConfirmationDataMock).not.toHaveBeenCalled();
  });
});
