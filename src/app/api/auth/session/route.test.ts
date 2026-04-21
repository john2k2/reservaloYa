import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedSupabaseUserMock, getSupabaseAdminClientMock } = vi.hoisted(() => ({
  getAuthenticatedSupabaseUserMock: vi.fn(),
  getSupabaseAdminClientMock: vi.fn(),
}));

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/server/supabase-store/_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

function makeSupabaseClient(businessName?: string | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue(
            businessName != null
              ? { data: { name: businessName }, error: null }
              : { data: null, error: new Error("not found") }
          ),
        })),
      })),
    })),
  };
}

describe("auth session route", () => {
  const originalEnv = process.env.PLATFORM_SUPERADMIN_EMAIL;

  beforeEach(() => {
    vi.resetModules();
    getAuthenticatedSupabaseUserMock.mockReset();
    getSupabaseAdminClientMock.mockReset();
    process.env.PLATFORM_SUPERADMIN_EMAIL = "platform@reservaya.app";
  });

  afterAll(() => {
    process.env.PLATFORM_SUPERADMIN_EMAIL = originalEnv;
  });

  it("returns anonymous payload when there is no authenticated user", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue(null);
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
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "platform@reservaya.app",
      name: "Platform Admin",
      role: "owner",
    });
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

  it("returns business name for owners with a linked business", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u2",
      email: "owner@demo.com",
      name: "Owner Demo",
      role: "owner",
      businessId: "biz-1",
    });
    getSupabaseAdminClientMock.mockResolvedValue(makeSupabaseClient("Demo Barberia"));
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

  it("falls back to user name when business lookup fails", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u3",
      email: "owner@demo.com",
      name: "Owner Demo",
      role: "owner",
      businessId: "biz-1",
    });
    getSupabaseAdminClientMock.mockResolvedValue(makeSupabaseClient(null));
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: true,
      isPlatformAdmin: false,
      displayName: "Owner Demo",
      subscriptionExpired: false,
    });
  });

  it("returns the user name for non-owner sessions without business", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u4",
      email: "staff@demo.com",
      name: "Staff Demo",
      role: "staff",
    });
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      loggedIn: true,
      isPlatformAdmin: false,
      displayName: "Staff Demo",
      subscriptionExpired: false,
    });
  });

  it("returns anonymous payload when the session check throws", async () => {
    getAuthenticatedSupabaseUserMock.mockRejectedValue(new Error("Supabase error"));
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
});
