import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

type MockRecord = {
  email?: string;
  name?: string;
  role?: string;
  business?: string | string[];
};

const { createPocketBaseServerClientMock, refreshPocketBaseAuthMock } = vi.hoisted(() => ({
  createPocketBaseServerClientMock: vi.fn(),
  refreshPocketBaseAuthMock: vi.fn(),
}));

vi.mock("@/lib/pocketbase/server", () => ({
  createPocketBaseServerClient: createPocketBaseServerClientMock,
  refreshPocketBaseAuth: refreshPocketBaseAuthMock,
}));

function createPbMock({
  record,
  subscriptions = [],
  businessName = "Barberia Clasica",
}: {
  record?: MockRecord | null;
  subscriptions?: Array<{ status: string; trialEndsAt?: string }>;
  businessName?: string;
}) {
  return {
    authStore: {
      record: record ?? null,
    },
    filter: vi.fn(() => "businessId = 'biz-1'"),
    collection: vi.fn((name: string) => {
      if (name === "subscriptions") {
        return {
          getFullList: vi.fn().mockResolvedValue(subscriptions),
        };
      }

      if (name === "businesses") {
        return {
          getOne: vi.fn().mockResolvedValue({ name: businessName }),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    }),
  };
}

describe("auth session route", () => {
  const originalEnv = process.env.PLATFORM_SUPERADMIN_EMAIL;

  beforeEach(() => {
    vi.resetModules();
    createPocketBaseServerClientMock.mockReset();
    refreshPocketBaseAuthMock.mockReset();
    process.env.PLATFORM_SUPERADMIN_EMAIL = "platform@reservaya.app";
  });

  afterAll(() => {
    process.env.PLATFORM_SUPERADMIN_EMAIL = originalEnv;
  });

  it("returns anonymous payload when auth cannot be refreshed", async () => {
    const pb = createPbMock({ record: null });
    createPocketBaseServerClientMock.mockResolvedValue(pb);
    refreshPocketBaseAuthMock.mockResolvedValue(false);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: false,
      isPlatformAdmin: false,
      displayName: "",
      subscriptionExpired: false,
    });
  });

  it("returns platform admin payload when email matches superadmin", async () => {
    const pb = createPbMock({
      record: { email: "platform@reservaya.app", name: "Platform Admin" },
    });
    createPocketBaseServerClientMock.mockResolvedValue(pb);
    refreshPocketBaseAuthMock.mockResolvedValue(true);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: true,
      isPlatformAdmin: true,
      displayName: "Admin",
      subscriptionExpired: false,
    });
  });

  it("marks owner as expired when subscription is suspended", async () => {
    const pb = createPbMock({
      record: { email: "owner@demo.com", role: "owner", business: "biz-1" },
      subscriptions: [{ status: "suspended" }],
    });
    createPocketBaseServerClientMock.mockResolvedValue(pb);
    refreshPocketBaseAuthMock.mockResolvedValue(true);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: false,
      isPlatformAdmin: false,
      displayName: "",
      subscriptionExpired: true,
    });
  });

  it("returns business name for active owners", async () => {
    const pb = createPbMock({
      record: { email: "owner@demo.com", role: "owner", business: ["biz-1"] },
      subscriptions: [{ status: "active" }],
      businessName: "Demo Barberia",
    });
    createPocketBaseServerClientMock.mockResolvedValue(pb);
    refreshPocketBaseAuthMock.mockResolvedValue(true);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: true,
      isPlatformAdmin: false,
      displayName: "Demo Barberia",
      subscriptionExpired: false,
    });
  });
});

