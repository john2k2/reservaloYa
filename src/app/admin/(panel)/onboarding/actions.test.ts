import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  revalidateTagMock,
  requireAdminRouteAccessMock,
  saveBrandingImageUploadMock,
  listSupabaseRecordsMock,
  createSupabaseRecordMock,
  updateSupabaseRecordMock,
  getSupabaseRecordMock,
  clearSupabaseBusinessMPTokensMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
  requireAdminRouteAccessMock: vi.fn(),
  saveBrandingImageUploadMock: vi.fn(),
  listSupabaseRecordsMock: vi.fn(),
  createSupabaseRecordMock: vi.fn(),
  updateSupabaseRecordMock: vi.fn(),
  getSupabaseRecordMock: vi.fn(),
  clearSupabaseBusinessMPTokensMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/server/admin-access", () => ({
  requireAdminRouteAccess: requireAdminRouteAccessMock,
}));

vi.mock("@/server/branding-upload", () => ({
  saveBrandingImageUpload: saveBrandingImageUploadMock,
}));

vi.mock("@/server/supabase-store/_core", () => ({
  listSupabaseRecords: listSupabaseRecordsMock,
  createSupabaseRecord: createSupabaseRecordMock,
  updateSupabaseRecord: updateSupabaseRecordMock,
  getSupabaseRecord: getSupabaseRecordMock,
}));

vi.mock("@/server/supabase-store", () => ({
  clearSupabaseBusinessMPTokens: clearSupabaseBusinessMPTokensMock,
}));

vi.mock("date-fns-tz", () => ({
  formatInTimeZone: vi.fn((date: Date) => date.toISOString()),
}));

vi.mock("date-fns/locale", () => ({
  es: {},
}));

describe("onboarding owner-only actions", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    requireAdminRouteAccessMock.mockReset();
    saveBrandingImageUploadMock.mockReset();
    listSupabaseRecordsMock.mockReset();
    createSupabaseRecordMock.mockReset();
    updateSupabaseRecordMock.mockReset();
    getSupabaseRecordMock.mockReset();
    revalidateTagMock.mockReset();
    clearSupabaseBusinessMPTokensMock.mockReset();
  });

  it("blocks staff from creating businesses from onboarding quickly", async () => {
    requireAdminRouteAccessMock.mockRejectedValue(
      new Error(
        "REDIRECT:/admin/dashboard?error=Solo%20el%20owner%20puede%20cambiar%20la%20pagina%20y%20la%20configuracion%20del%20negocio."
      )
    );

    const start = Date.now();
    const { createOnboardedBusinessAction } = await import("./actions");
    const formData = new FormData();
    formData.set("templateSlug", "demo-barberia");
    formData.set("name", "Barberia Staff");
    formData.set("slug", "barberia-staff");
    formData.set("phone", "1122334455");
    formData.set("email", "owner@example.com");
    formData.set("address", "Calle 123");

    await expect(createOnboardedBusinessAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createSupabaseRecordMock).not.toHaveBeenCalled();
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("lets owners create businesses from onboarding", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    listSupabaseRecordsMock.mockResolvedValue([
      {
        id: "biz_existing",
        slug: "demo-barberia",
        name: "Demo Barberia",
        active: true,
      },
    ]);
    createSupabaseRecordMock.mockResolvedValue({ id: "biz_new", slug: "nueva-barberia" });

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
    expect(createSupabaseRecordMock).toHaveBeenCalled();
  });

  it("updates an existing business settings", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    listSupabaseRecordsMock.mockResolvedValue([
      {
        id: "biz_123",
        slug: "demo-barberia",
        name: "Demo Barberia",
        active: true,
      },
    ]);
    updateSupabaseRecordMock.mockResolvedValue({ id: "biz_123" });

    const { updateOnboardedBusinessAction } = await import("./actions");
    const formData = new FormData();
    formData.set("businessSlug", "demo-barberia");
    formData.set("name", "Nueva Barberia");
    formData.set("phone", "1122334455");
    formData.set("email", "nuevo@example.com");
    formData.set("address", "Calle 456");

    await expect(updateOnboardedBusinessAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/onboarding?businessUpdated=Nueva%20Barberia"
    );
    expect(updateSupabaseRecordMock).toHaveBeenCalledWith("businesses", "biz_123", expect.any(Object));
  });

  it("rejects updating a business that does not belong to the caller", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    // Attacker's session owns biz_123 but submits a competitor's public slug,
    // which resolves to a foreign business row.
    listSupabaseRecordsMock.mockResolvedValue([
      {
        id: "biz_victim",
        slug: "competencia",
        name: "Competencia",
        active: true,
      },
    ]);

    const { updateOnboardedBusinessAction } = await import("./actions");
    const formData = new FormData();
    formData.set("businessSlug", "competencia");
    formData.set("name", "Hackeado");
    formData.set("phone", "1122334455");
    formData.set("email", "attacker@example.com");
    formData.set("address", "Calle 456");

    await expect(updateOnboardedBusinessAction(formData)).rejects.toThrow(/permisos/);
    expect(updateSupabaseRecordMock).not.toHaveBeenCalled();
  });

  it("rejects saving branding for a business that does not belong to the caller", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    listSupabaseRecordsMock.mockResolvedValue([
      {
        id: "biz_victim",
        slug: "competencia",
        name: "Competencia",
        active: true,
      },
    ]);

    const { saveOnboardingBrandingAction } = await import("./actions");
    const formData = new FormData();
    formData.set("businessSlug", "competencia");
    formData.set("badge", "Barberia");
    formData.set("eyebrow", "Cortes premium");
    formData.set("headline", "Reserva tu turno online");
    formData.set("description", "La mejor barberia de la ciudad para vos");
    formData.set("primaryCta", "Reservar");
    formData.set("secondaryCta", "Ver mas");
    formData.set("palette", "esmeralda");

    await expect(saveOnboardingBrandingAction(formData)).rejects.toThrow(/permisos/);
    // Neither the DB write nor the image uploads (which are keyed by slug) run.
    expect(updateSupabaseRecordMock).not.toHaveBeenCalled();
    expect(saveBrandingImageUploadMock).not.toHaveBeenCalled();
  });

  it("rejects disconnecting MercadoPago for a business that does not belong to the caller", async () => {
    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      userRole: "owner",
      demoMode: false,
    });
    listSupabaseRecordsMock.mockResolvedValue([
      {
        id: "biz_victim",
        slug: "competencia",
        name: "Competencia",
        active: true,
      },
    ]);

    const { disconnectMercadoPagoInlineAction } = await import("./actions");
    const formData = new FormData();
    formData.set("businessSlug", "competencia");

    await expect(disconnectMercadoPagoInlineAction(formData)).rejects.toThrow();
    expect(clearSupabaseBusinessMPTokensMock).not.toHaveBeenCalled();
  });
});
