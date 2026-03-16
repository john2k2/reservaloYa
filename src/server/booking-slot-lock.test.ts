import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createPocketBaseAdminClientMock,
  isPocketBaseAdminConfiguredMock,
  isPocketBaseConfiguredMock,
} = vi.hoisted(() => ({
  createPocketBaseAdminClientMock: vi.fn(),
  isPocketBaseAdminConfiguredMock: vi.fn(() => false),
  isPocketBaseConfiguredMock: vi.fn(() => false),
}));

vi.mock("@/lib/pocketbase/admin", () => ({
  createPocketBaseAdminClient: createPocketBaseAdminClientMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseAdminConfigured: isPocketBaseAdminConfiguredMock,
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

describe("withBookingDateLock", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    createPocketBaseAdminClientMock.mockReset();
    isPocketBaseAdminConfiguredMock.mockReturnValue(false);
    isPocketBaseConfiguredMock.mockReturnValue(false);
  });

  it("serializes concurrent operations with the memory lock", async () => {
    const { resetBookingLocksForTests, withBookingDateLock } = await import("./booking-slot-lock");
    resetBookingLocksForTests();

    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;

    const first = withBookingDateLock(
      { businessKey: "demo-barberia", bookingDate: "2026-03-20" },
      async () => {
        order.push("first-start");
        await new Promise<void>((resolve) => {
          releaseFirst = () => {
            order.push("first-end");
            resolve();
          };
        });
      }
    );

    const second = withBookingDateLock(
      { businessKey: "demo-barberia", bookingDate: "2026-03-20" },
      async () => {
        order.push("second-start");
      }
    );

    await Promise.resolve();
    expect(order).toEqual(["first-start"]);

    releaseFirst?.();
    await Promise.all([first, second]);

    expect(order).toEqual(["first-start", "first-end", "second-start"]);
  });

  it("uses the shared PocketBase lock path when available and releases it after the operation", async () => {
    vi.stubEnv("NODE_ENV", "production");
    isPocketBaseConfiguredMock.mockReturnValue(true);
    isPocketBaseAdminConfiguredMock.mockReturnValue(true);

    const deleteMock = vi.fn(async () => true);
    const createMock = vi.fn(async () => ({ id: "lock_123" }));
    const getFullListMock = vi.fn(async () => []);
    const collectionMock = vi.fn(() => ({
      create: createMock,
      delete: deleteMock,
      getFullList: getFullListMock,
    }));

    createPocketBaseAdminClientMock.mockResolvedValue({
      collection: collectionMock,
      filter: vi.fn(() => "expiresAt <= {:now}"),
    });

    const { withBookingDateLock } = await import("./booking-slot-lock");

    await expect(
      withBookingDateLock(
        { businessKey: "demo-barberia", bookingDate: "2026-03-21" },
        async () => "ok"
      )
    ).resolves.toBe("ok");

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith("lock_123");
  });

  it("falls back to the memory lock when the shared collection is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    isPocketBaseConfiguredMock.mockReturnValue(true);
    isPocketBaseAdminConfiguredMock.mockReturnValue(true);

    createPocketBaseAdminClientMock.mockResolvedValue({
      collection: vi.fn(() => ({
        create: vi.fn(async () => {
          const error = new Error("missing collection") as Error & { status: number };
          error.status = 404;
          throw error;
        }),
        delete: vi.fn(async () => true),
        getFullList: vi.fn(async () => []),
      })),
      filter: vi.fn(() => "expiresAt <= {:now}"),
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { withBookingDateLock } = await import("./booking-slot-lock");

    await expect(
      withBookingDateLock(
        { businessKey: "demo-barberia", bookingDate: "2026-03-22" },
        async () => "fallback-ok"
      )
    ).resolves.toBe("fallback-ok");

    expect(errorSpy).toHaveBeenCalledWith(
      "[booking-lock] booking_locks collection is missing, falling back to memory lock"
    );
  });
});
