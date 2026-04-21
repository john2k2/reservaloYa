import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  getAuthenticatedSupabaseUserMock,
  listSupabaseRecordsMock,
  getSupabaseRecordMock,
  createSupabaseRecordMock,
  updateSupabaseRecordMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
  getAuthenticatedSupabaseUserMock: vi.fn(),
  listSupabaseRecordsMock: vi.fn(),
  getSupabaseRecordMock: vi.fn(),
  createSupabaseRecordMock: vi.fn(),
  updateSupabaseRecordMock: vi.fn(),
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

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/server/supabase-store/_core", () => ({
  listSupabaseRecords: listSupabaseRecordsMock,
  getSupabaseRecord: getSupabaseRecordMock,
  createSupabaseRecord: createSupabaseRecordMock,
  updateSupabaseRecord: updateSupabaseRecordMock,
}));

describe("admin services actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    getAuthenticatedSupabaseUserMock.mockReset();
    listSupabaseRecordsMock.mockReset();
    getSupabaseRecordMock.mockReset();
    createSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();

    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "user_1",
      businessId: "biz_123",
      businessSlug: "demo-barberia",
      role: "owner",
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
    expect(createSupabaseRecordMock).not.toHaveBeenCalled();
  });

  it("saves a service and redirects with success", async () => {
    listSupabaseRecordsMock.mockResolvedValue([]);
    createSupabaseRecordMock.mockResolvedValue({ id: "service_1" });

    const { saveServiceAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Corte");
    formData.set("description", "Servicio base");
    formData.set("durationMinutes", "30");
    formData.set("price", "18000");
    formData.set("featured", "on");
    formData.set("featuredLabel", "Mas elegido");

    await expect(saveServiceAction(formData)).rejects.toThrow("REDIRECT:/admin/services?saved=Corte");
    expect(createSupabaseRecordMock).toHaveBeenCalledWith("services", {
      business_id: "biz_123",
      name: "Corte",
      description: "Servicio base",
      durationMinutes: 30,
      price: 18000,
      featured: true,
      featuredLabel: "Mas elegido",
      active: true,
    });
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("updates an existing service", async () => {
    const existingService = {
      id: "service_1",
      business_id: "biz_123",
      name: "Corte",
      description: "Servicio base",
      durationMinutes: 30,
      price: 15000,
      featured: false,
      active: true,
    };
    listSupabaseRecordsMock.mockResolvedValue([existingService]);
    getSupabaseRecordMock.mockResolvedValue(existingService);
    updateSupabaseRecordMock.mockResolvedValue(existingService);

    const { saveServiceAction } = await import("./actions");
    const formData = new FormData();
    formData.set("serviceId", "service_1");
    formData.set("name", "Corte Premium");
    formData.set("description", "Servicio premium");
    formData.set("durationMinutes", "45");
    formData.set("price", "25000");
    formData.set("featured", "on");
    formData.set("featuredLabel", "Nuevo");

    await expect(saveServiceAction(formData)).rejects.toThrow("REDIRECT:/admin/services?saved=Corte%20Premium");
    expect(updateSupabaseRecordMock).toHaveBeenCalled();
  });
});