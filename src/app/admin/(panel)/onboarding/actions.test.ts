import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  requireAdminRouteAccessMock,
  setLocalActiveBusinessSlugMock,
  createLocalBusinessFromTemplateMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  requireAdminRouteAccessMock: vi.fn(),
  setLocalActiveBusinessSlugMock: vi.fn(),
  createLocalBusinessFromTemplateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/admin-access", () => ({
  requireAdminRouteAccess: requireAdminRouteAccessMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

vi.mock("@/server/local-admin-context", () => ({
  setLocalActiveBusinessSlug: setLocalActiveBusinessSlugMock,
}));

vi.mock("@/server/local-store", () => ({
  createLocalBusinessFromTemplate: createLocalBusinessFromTemplateMock,
  getLocalAdminSettingsData: vi.fn(),
  updateLocalBusiness: vi.fn(),
  updateLocalBusinessBranding: vi.fn(),
}));

vi.mock("@/server/pocketbase-store", () => ({
  createPocketBaseBusinessFromTemplate: vi.fn(),
  getPocketBaseAdminSettingsData: vi.fn(),
  updatePocketBaseBusiness: vi.fn(),
  updatePocketBaseBusinessBranding: vi.fn(),
}));

vi.mock("@/server/pocketbase-auth", () => ({
  getAuthenticatedPocketBaseUser: vi.fn(),
}));

vi.mock("@/server/branding-upload", () => ({
  saveBrandingImageUpload: vi.fn(),
}));

describe("onboarding owner-only actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    requireAdminRouteAccessMock.mockReset();
    setLocalActiveBusinessSlugMock.mockReset();
    createLocalBusinessFromTemplateMock.mockReset();
  });

  it("blocks staff from creating businesses from onboarding", async () => {
    requireAdminRouteAccessMock.mockRejectedValue(
      new Error(
        "REDIRECT:/admin/dashboard?error=Solo%20el%20owner%20puede%20cambiar%20la%20pagina%20y%20la%20configuracion%20del%20negocio."
      )
    );

    const { createOnboardedBusinessAction } = await import("./actions");
    const formData = new FormData();
    formData.set("templateSlug", "demo-barberia");
    formData.set("name", "Barberia Staff");
    formData.set("slug", "barberia-staff");
    formData.set("phone", "1122334455");
    formData.set("email", "owner@example.com");
    formData.set("address", "Calle 123");

    await expect(createOnboardedBusinessAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createLocalBusinessFromTemplateMock).not.toHaveBeenCalled();
    expect(setLocalActiveBusinessSlugMock).not.toHaveBeenCalled();
  });

  it("lets owners create businesses from onboarding", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    createLocalBusinessFromTemplateMock.mockResolvedValue("nueva-barberia");

    const { createOnboardedBusinessAction } = await import("./actions");
    const formData = new FormData();
    formData.set("templateSlug", "demo-barberia");
    formData.set("name", "Nueva Barberia");
    formData.set("slug", "nueva-barberia");
    formData.set("phone", "1122334455");
    formData.set("email", "owner@example.com");
    formData.set("address", "Calle 123");

    await expect(createOnboardedBusinessAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/onboarding?created=nueva-barberia"
    );
    expect(createLocalBusinessFromTemplateMock).toHaveBeenCalled();
    expect(setLocalActiveBusinessSlugMock).toHaveBeenCalledWith("nueva-barberia");
  });
});
