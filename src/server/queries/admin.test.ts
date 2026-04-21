import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedSupabaseUserMock = vi.fn();
const getSupabaseAdminShellDataMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/server/supabase-store", () => ({
  getSupabaseAdminShellData: getSupabaseAdminShellDataMock,
}));

describe("getAdminShellData", () => {
  beforeEach(() => {
    vi.resetModules();
    getAuthenticatedSupabaseUserMock.mockReset();
    getSupabaseAdminShellDataMock.mockReset();
  });

  it("returns null when no authenticated user", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue(null);
    const { getAdminShellData } = await import("./admin");

    await expect(getAdminShellData()).resolves.toBeNull();
    expect(getSupabaseAdminShellDataMock).not.toHaveBeenCalled();
  });

  it("returns shell data when user is authenticated", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    const mockShellData = {
      demoMode: false,
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      profileName: "Test",
      userEmail: "test@example.com",
    };

    getAuthenticatedSupabaseUserMock.mockResolvedValue(mockUser);
    getSupabaseAdminShellDataMock.mockResolvedValue(mockShellData);

    const { getAdminShellData } = await import("./admin");

    await expect(getAdminShellData()).resolves.toEqual(mockShellData);
    expect(getSupabaseAdminShellDataMock).toHaveBeenCalledWith(mockUser);
  });
});