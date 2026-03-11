import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  isPocketBaseConfiguredMock,
  createPocketBaseServerClientMock,
  getAdminShellDataMock,
  createPocketBaseStaffAccountMock,
  updatePocketBaseTeamUserStatusMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  isPocketBaseConfiguredMock: vi.fn(() => true),
  createPocketBaseServerClientMock: vi.fn(),
  getAdminShellDataMock: vi.fn(),
  createPocketBaseStaffAccountMock: vi.fn(),
  updatePocketBaseTeamUserStatusMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/lib/pocketbase/server", () => ({
  createPocketBaseServerClient: createPocketBaseServerClientMock,
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  createPocketBaseStaffAccount: createPocketBaseStaffAccountMock,
  updatePocketBaseTeamUserStatus: updatePocketBaseTeamUserStatusMock,
}));

describe("team management actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    isPocketBaseConfiguredMock.mockReset();
    isPocketBaseConfiguredMock.mockReturnValue(true);
    createPocketBaseServerClientMock.mockReset();
    getAdminShellDataMock.mockReset();
    createPocketBaseStaffAccountMock.mockReset();
    updatePocketBaseTeamUserStatusMock.mockReset();

    getAdminShellDataMock.mockResolvedValue({
      businessId: "biz_123",
      demoMode: false,
      userRole: "owner",
    });
  });

  it("creates a staff user and requests verification", async () => {
    const requestVerificationMock = vi.fn(async () => true);
    createPocketBaseStaffAccountMock.mockResolvedValue({
      id: "user_staff_1",
      email: "staff@example.com",
    });
    createPocketBaseServerClientMock.mockResolvedValue({
      collection: vi.fn(() => ({
        requestVerification: requestVerificationMock,
      })),
    });

    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "STAFF@example.com");
    formData.set("password", "Temporal123");

    await expect(createStaffAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createPocketBaseStaffAccountMock).toHaveBeenCalledWith({
      businessId: "biz_123",
      name: "Sofia Staff",
      email: "staff@example.com",
      password: "Temporal123",
      role: "staff",
    });
    expect(requestVerificationMock).toHaveBeenCalledWith("staff@example.com");
    expect(String(redirectMock.mock.calls.at(-1)?.[0] ?? "")).toContain(
      "/admin/team?success=Usuario%20creado%20correctamente."
    );
  });

  it("blocks non-owners from creating staff users", async () => {
    getAdminShellDataMock.mockResolvedValue({
      businessId: "biz_123",
      demoMode: false,
      userRole: "staff",
    });

    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "staff@example.com");
    formData.set("password", "Temporal123");

    await expect(createStaffAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createPocketBaseStaffAccountMock).not.toHaveBeenCalled();
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Solo el owner puede gestionar el equipo"
    );
  });

  it("validates staff form data before creating the user", async () => {
    const { createStaffAction } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Sofia Staff");
    formData.set("email", "staff@example.com");
    formData.set("password", "short");

    await expect(createStaffAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createPocketBaseStaffAccountMock).not.toHaveBeenCalled();
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "La contrasena temporal debe tener al menos 8 caracteres"
    );
  });

  it("updates staff status for owner users", async () => {
    updatePocketBaseTeamUserStatusMock.mockResolvedValue(undefined);

    const { updateStaffStatusAction } = await import("./actions");
    const formData = new FormData();
    formData.set("userId", "user_staff_1");
    formData.set("nextActive", "false");

    await expect(updateStaffStatusAction(formData)).rejects.toThrow("REDIRECT:");
    expect(updatePocketBaseTeamUserStatusMock).toHaveBeenCalledWith({
      businessId: "biz_123",
      userId: "user_staff_1",
      active: false,
    });
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Usuario desactivado correctamente."
    );
  });
});
