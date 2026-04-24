import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getAuthenticatedPlatformAdminMock,
  togglePlatformBusinessActiveMock,
  enableTrialMock,
  extendTrialMock,
  cancelSubscriptionMock,
  unlockBusinessSubscriptionMock,
  generateImpersonationLinkMock,
  writeAuditLogMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getAuthenticatedPlatformAdminMock: vi.fn(),
  togglePlatformBusinessActiveMock: vi.fn(),
  enableTrialMock: vi.fn(),
  extendTrialMock: vi.fn(),
  cancelSubscriptionMock: vi.fn(),
  unlockBusinessSubscriptionMock: vi.fn(),
  generateImpersonationLinkMock: vi.fn(),
  writeAuditLogMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/platform-auth", () => ({
  getAuthenticatedPlatformAdmin: getAuthenticatedPlatformAdminMock,
}));

vi.mock("@/server/queries/platform", () => ({
  togglePlatformBusinessActive: togglePlatformBusinessActiveMock,
  enableTrial: enableTrialMock,
  extendTrial: extendTrialMock,
  cancelSubscription: cancelSubscriptionMock,
  unlockBusinessSubscription: unlockBusinessSubscriptionMock,
  generateImpersonationLink: generateImpersonationLinkMock,
}));

vi.mock("@/server/audit-log", () => ({
  writeAuditLog: writeAuditLogMock,
}));

describe("platform actions", () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    getAuthenticatedPlatformAdminMock.mockReset();
    togglePlatformBusinessActiveMock.mockReset();
    enableTrialMock.mockReset();
    extendTrialMock.mockReset();
    cancelSubscriptionMock.mockReset();
    unlockBusinessSubscriptionMock.mockReset();
    generateImpersonationLinkMock.mockReset();
    writeAuditLogMock.mockReset();

    getAuthenticatedPlatformAdminMock.mockResolvedValue({
      id: "platform_admin_1",
      email: "platform@reservaya.app",
    });
  });

  it("rechaza acciones sin platform admin autenticado", async () => {
    getAuthenticatedPlatformAdminMock.mockResolvedValue(null);

    const { toggleBusinessActiveAction } = await import("./platform");

    await expect(toggleBusinessActiveAction("biz_123", false)).rejects.toThrow("No autorizado");
    expect(togglePlatformBusinessActiveMock).not.toHaveBeenCalled();
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });

  it("audita la activacion y desactivacion de negocios", async () => {
    const { toggleBusinessActiveAction } = await import("./platform");

    await toggleBusinessActiveAction("biz_123", false);

    expect(togglePlatformBusinessActiveMock).toHaveBeenCalledWith("biz_123", false);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      { userId: "platform_admin_1", userEmail: "platform@reservaya.app", businessId: "biz_123" },
      "platform.business_deactivated",
      "biz_123",
      { active: false }
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/platform/businesses");
    expect(revalidatePathMock).toHaveBeenCalledWith("/platform/dashboard");
  });

  it("audita cambios de trial y suscripcion", async () => {
    const {
      enableTrialAction,
      extendTrialAction,
      cancelSubscriptionAction,
      unlockSubscriptionAction,
    } = await import("./platform");

    await enableTrialAction("biz_123", 14);
    await extendTrialAction("biz_123", 7);
    await cancelSubscriptionAction("biz_123");
    await unlockSubscriptionAction("biz_123");

    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.any(Object),
      "platform.trial_enabled",
      "biz_123",
      { days: 14 }
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.any(Object),
      "platform.trial_extended",
      "biz_123",
      { days: 7 }
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.any(Object),
      "platform.subscription_cancelled",
      "biz_123",
      {}
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.any(Object),
      "platform.subscription_unlocked",
      "biz_123",
      {}
    );
  });

  it("audita la generacion de link de impersonation sin guardar el link", async () => {
    generateImpersonationLinkMock.mockResolvedValue("https://example.com/magic-link");

    const { impersonateBusinessOwnerAction } = await import("./platform");

    await expect(impersonateBusinessOwnerAction("biz_123")).resolves.toBe("https://example.com/magic-link");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      { userId: "platform_admin_1", userEmail: "platform@reservaya.app", businessId: "biz_123" },
      "platform.impersonation_link_created",
      "biz_123",
      {}
    );
  });

  it("no rompe la accion si falla el audit log", async () => {
    writeAuditLogMock.mockRejectedValue(new Error("audit down"));

    const { cancelSubscriptionAction } = await import("./platform");

    await expect(cancelSubscriptionAction("biz_123")).resolves.toBeUndefined();
    expect(cancelSubscriptionMock).toHaveBeenCalledWith("biz_123");
  });
});
