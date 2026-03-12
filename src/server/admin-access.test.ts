import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, getAdminShellDataMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  getAdminShellDataMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
}));

describe("requireAdminRouteAccess", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getAdminShellDataMock.mockReset();
  });

  it("redirects anonymous users to login", async () => {
    getAdminShellDataMock.mockResolvedValue(null);
    const { requireAdminRouteAccess } = await import("./admin-access");

    await expect(requireAdminRouteAccess("/admin/onboarding")).rejects.toThrow(
      "REDIRECT:/admin/login?error=Inicia sesion para continuar."
    );
  });

  it("redirects staff away from owner-only routes", async () => {
    getAdminShellDataMock.mockResolvedValue({
      demoMode: false,
      businessId: "biz_123",
      userRole: "staff",
    });
    const { requireAdminRouteAccess } = await import("./admin-access");

    await expect(requireAdminRouteAccess("/admin/onboarding")).rejects.toThrow("REDIRECT:");
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Solo el owner puede cambiar la pagina y la configuracion del negocio."
    );
  });

  it("allows owner users into owner-only routes", async () => {
    getAdminShellDataMock.mockResolvedValue({
      demoMode: false,
      businessId: "biz_123",
      userRole: "owner",
      businessSlug: "demo-barberia",
    });
    const { requireAdminRouteAccess } = await import("./admin-access");

    await expect(requireAdminRouteAccess("/admin/onboarding")).resolves.toMatchObject({
      businessId: "biz_123",
      userRole: "owner",
    });
  });
});
