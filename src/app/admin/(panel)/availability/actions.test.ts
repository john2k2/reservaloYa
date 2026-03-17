import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  upsertLocalAvailabilityRulesMock,
  createLocalBlockedSlotsMock,
  removeLocalBlockedSlotMock,
  getLocalAdminSettingsDataMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  upsertLocalAvailabilityRulesMock: vi.fn(),
  createLocalBlockedSlotsMock: vi.fn(),
  removeLocalBlockedSlotMock: vi.fn(),
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
  upsertLocalAvailabilityRules: upsertLocalAvailabilityRulesMock,
  createLocalBlockedSlots: createLocalBlockedSlotsMock,
  removeLocalBlockedSlot: removeLocalBlockedSlotMock,
  getLocalAdminSettingsData: getLocalAdminSettingsDataMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  upsertPocketBaseAvailabilityRules: vi.fn(),
  createPocketBaseBlockedSlots: vi.fn(),
  removePocketBaseBlockedSlot: vi.fn(),
  getPocketBaseAdminSettingsData: vi.fn(),
}));

vi.mock("@/server/pocketbase-auth", () => ({
  getAuthenticatedPocketBaseUser: vi.fn(),
}));

describe("admin availability actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    upsertLocalAvailabilityRulesMock.mockReset();
    createLocalBlockedSlotsMock.mockReset();
    removeLocalBlockedSlotMock.mockReset();
    getLocalAdminSettingsDataMock.mockReset();
    revalidatePathMock.mockReset();

    getLocalAdminSettingsDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
  });

  it("rejects invalid weekly ranges", async () => {
    const { saveAvailabilityRulesAction } = await import("./actions");
    const formData = new FormData();
    formData.set("scope", "day:1");
    formData.set("ruleId_1", "");
    formData.set("active_1", "true");
    formData.set("startTime_1", "18:00");
    formData.set("endTime_1", "09:00");

    await expect(saveAvailabilityRulesAction(formData)).rejects.toThrow(
      "La hora de fin debe quedar después de la hora de inicio."
    );
    expect(upsertLocalAvailabilityRulesMock).not.toHaveBeenCalled();
  });

  it("creates weekly blocked slots and redirects with summary", async () => {
    createLocalBlockedSlotsMock.mockResolvedValue({
      createdCount: 3,
      skippedCount: 0,
    });

    const { createBlockedSlotAction } = await import("./actions");
    const formData = new FormData();
    formData.set("blockMode", "weekly");
    formData.set("repeatFromDate", "2026-03-16");
    formData.set("repeatDayOfWeek", "1");
    formData.set("repeatWeeks", "3");
    formData.set("startTime", "13:00");
    formData.set("endTime", "14:00");
    formData.set("reason", "Almuerzo");

    await expect(createBlockedSlotAction(formData)).rejects.toThrow("REDIRECT:");
    expect(createLocalBlockedSlotsMock).toHaveBeenCalled();
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Se agregaron 3 bloqueos"
    );
    expect(revalidatePathMock).toHaveBeenCalled();
  });
});
