import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  upsertLocalServiceMock,
  deactivateLocalServiceMock,
  getLocalAdminSettingsDataMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  upsertLocalServiceMock: vi.fn(),
  deactivateLocalServiceMock: vi.fn(),
  getLocalAdminSettingsDataMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

vi.mock("@/server/local-admin-context", () => ({
  getLocalActiveBusinessSlug: vi.fn(async () => "demo-barberia"),
}));

vi.mock("@/server/local-store", () => ({
  upsertLocalService: upsertLocalServiceMock,
  deactivateLocalService: deactivateLocalServiceMock,
  getLocalAdminSettingsData: getLocalAdminSettingsDataMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  upsertPocketBaseService: vi.fn(),
  deactivatePocketBaseService: vi.fn(),
  getPocketBaseAdminSettingsData: vi.fn(),
}));

vi.mock("@/server/pocketbase-auth", () => ({
  getAuthenticatedPocketBaseUser: vi.fn(),
}));

describe("admin services actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    upsertLocalServiceMock.mockReset();
    deactivateLocalServiceMock.mockReset();
    getLocalAdminSettingsDataMock.mockReset();
    revalidatePathMock.mockReset();

    getLocalAdminSettingsDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
  });

  it("shows a friendly error when price is invalid", async () => {
    const { saveServiceAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Corte");
    formData.set("description", "Servicio base");
    formData.set("durationMinutes", "30");
    formData.set("price", "12a");

    await expect(saveServiceAction(formData)).rejects.toThrow("El precio debe ser un numero valido.");
    expect(upsertLocalServiceMock).not.toHaveBeenCalled();
  });

  it("saves a local service and redirects with success", async () => {
    upsertLocalServiceMock.mockResolvedValue("service_1");

    const { saveServiceAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Corte");
    formData.set("description", "Servicio base");
    formData.set("durationMinutes", "30");
    formData.set("price", "18000");
    formData.set("featured", "on");
    formData.set("featuredLabel", "Mas elegido");

    await expect(saveServiceAction(formData)).rejects.toThrow("REDIRECT:/admin/services?saved=Corte");
    expect(upsertLocalServiceMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      serviceId: undefined,
      name: "Corte",
      description: "Servicio base",
      durationMinutes: 30,
      price: 18000,
      featured: true,
      featuredLabel: "Mas elegido",
    });
    expect(revalidatePathMock).toHaveBeenCalled();
  });
});
