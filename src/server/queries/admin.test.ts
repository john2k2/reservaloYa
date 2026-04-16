import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isDemoModeEnabledMock,
  isPocketBaseConfiguredMock,
  getLocalActiveBusinessSlugMock,
  getLocalAdminShellDataMock,
  getAuthenticatedPocketBaseUserMock,
  getPocketBaseAdminShellDataMock,
} = vi.hoisted(() => ({
  isDemoModeEnabledMock: vi.fn(),
  isPocketBaseConfiguredMock: vi.fn(),
  getLocalActiveBusinessSlugMock: vi.fn(),
  getLocalAdminShellDataMock: vi.fn(),
  getAuthenticatedPocketBaseUserMock: vi.fn(),
  getPocketBaseAdminShellDataMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

vi.mock("@/lib/runtime", () => ({
  isDemoModeEnabled: isDemoModeEnabledMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/server/local-admin-context", () => ({
  getLocalActiveBusinessSlug: getLocalActiveBusinessSlugMock,
}));

vi.mock("@/server/local-store", () => ({
  getLocalAdminAvailabilityData: vi.fn(),
  getLocalAdminBookingsData: vi.fn(),
  getLocalAdminCustomersData: vi.fn(),
  getLocalAdminDashboardData: vi.fn(),
  getLocalOnboardingData: vi.fn(),
  getLocalAdminServicesData: vi.fn(),
  getLocalAdminSettingsData: vi.fn(),
  getLocalAdminShellData: getLocalAdminShellDataMock,
}));

vi.mock("@/server/pocketbase-auth", () => ({
  getAuthenticatedPocketBaseUser: getAuthenticatedPocketBaseUserMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  getPocketBaseAdminAvailabilityData: vi.fn(),
  getPocketBaseAdminBookingsData: vi.fn(),
  getPocketBaseAdminCustomersData: vi.fn(),
  getPocketBaseAdminDashboardData: vi.fn(),
  getPocketBaseAdminServicesData: vi.fn(),
  getPocketBaseAdminSettingsData: vi.fn(),
  getPocketBaseAdminShellData: getPocketBaseAdminShellDataMock,
  getPocketBaseAdminTeamData: vi.fn(),
  getPocketBaseOnboardingData: vi.fn(),
}));

describe("getAdminShellData", () => {
  beforeEach(() => {
    vi.resetModules();
    isDemoModeEnabledMock.mockReset();
    isPocketBaseConfiguredMock.mockReset();
    getLocalActiveBusinessSlugMock.mockReset();
    getLocalAdminShellDataMock.mockReset();
    getAuthenticatedPocketBaseUserMock.mockReset();
    getPocketBaseAdminShellDataMock.mockReset();

    isPocketBaseConfiguredMock.mockReturnValue(false);
    isDemoModeEnabledMock.mockReturnValue(true);
    getLocalActiveBusinessSlugMock.mockResolvedValue("demo-barberia");
    getLocalAdminShellDataMock.mockResolvedValue({
      demoMode: true,
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      profileName: "Demo",
      userEmail: "demo@example.com",
    });
  });

  it("denies local admin mode in production without PocketBase", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { getAdminShellData } = await import("./admin");

    await expect(getAdminShellData()).resolves.toBeNull();
    expect(getLocalAdminShellDataMock).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("allows local admin mode outside production when demo mode is enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { getAdminShellData } = await import("./admin");

    await expect(getAdminShellData()).resolves.toMatchObject({
      demoMode: true,
      businessSlug: "demo-barberia",
    });
    expect(getLocalAdminShellDataMock).toHaveBeenCalledWith("demo-barberia");
    vi.unstubAllEnvs();
  });
});
