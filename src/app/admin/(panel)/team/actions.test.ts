import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  requireAdminRouteAccessMock,
  createSupabaseStaffAccountMock,
  updateSupabaseTeamUserStatusMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  requireAdminRouteAccessMock: vi.fn(),
  createSupabaseStaffAccountMock: vi.fn(),
  updateSupabaseTeamUserStatusMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/admin-access", () => ({
  requireAdminRouteAccess: requireAdminRouteAccessMock,
}));

vi.mock("@/server/supabase-auth", () => ({
  createSupabaseStaffAccount: createSupabaseStaffAccountMock,
  updateSupabaseTeamUserStatus: updateSupabaseTeamUserStatusMock,
}));

describe("team management actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    requireAdminRouteAccessMock.mockReset();
    createSupabaseStaffAccountMock.mockReset();
    updateSupabaseTeamUserStatusMock.mockReset();

    requireAdminRouteAccessMock.mockResolvedValue({
      businessId: "biz_123",
      demoMode: false,
      userRole: "owner",
    });
  });

  it("creates a staff user and redirects with success", async () => {
    createSupabaseStaffAccountMock.mockResolvedValue({
      id: "user_staff_1",
      email: "staff@example.com",
    });

    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "STAFF@example.com");
    formData.set("password", "Temporal123");

    await expect(createStaffAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createSupabaseStaffAccountMock).toHaveBeenCalledWith({
      businessId: "biz_123",
      name: "Sofia Staff",
      email: "staff@example.com",
      password: "Temporal123",
      role: "staff",
    });
    expect(String(redirectMock.mock.calls.at(-1)?.[0] ?? "")).toContain(
      "/admin/team?success=Usuario%20creado%20correctamente."
    );
  });

  it("blocks non-owners from creating staff users", async () => {
    requireAdminRouteAccessMock.mockRejectedValue(
      new Error("REDIRECT:/admin/dashboard?error=Solo%20el%20owner%20puede%20gestionar%20el%20equipo.")
    );

    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "staff@example.com");
    formData.set("password", "Temporal123");

    await expect(createStaffAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/dashboard?error=Solo%20el%20owner%20puede%20gestionar%20el%20equipo."
    );
    expect(createSupabaseStaffAccountMock).not.toHaveBeenCalled();
  });

  it("validates staff form data before creating the user", async () => {
    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "staff@example.com");
    formData.set("password", "short");

    await expect(createStaffAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createSupabaseStaffAccountMock).not.toHaveBeenCalled();
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "La contraseña temporal debe tener al menos 8 caracteres"
    );
  });

  it("updates staff status for owner users", async () => {
    updateSupabaseTeamUserStatusMock.mockResolvedValue(undefined);

    const { updateStaffStatusAction } = await import("./actions");
    const formData = new FormData();
    formData.set("userId", "user_staff_1");
    formData.set("nextActive", "false");

    await expect(updateStaffStatusAction(formData)).rejects.toThrow("REDIRECT:");
    expect(updateSupabaseTeamUserStatusMock).toHaveBeenCalledWith("user_staff_1", false);
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Usuario desactivado correctamente."
    );
  });
});