import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  getAuthenticatedSupabaseUserMock,
  getSupabaseRecordMock,
  listSupabaseRecordsMock,
  createSupabaseRecordMock,
  deleteSupabaseRecordMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
  getAuthenticatedSupabaseUserMock: vi.fn(),
  getSupabaseRecordMock: vi.fn(),
  listSupabaseRecordsMock: vi.fn(),
  createSupabaseRecordMock: vi.fn(),
  deleteSupabaseRecordMock: vi.fn(),
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
  getSupabaseRecord: getSupabaseRecordMock,
  listSupabaseRecords: listSupabaseRecordsMock,
  createSupabaseRecord: createSupabaseRecordMock,
  deleteSupabaseRecord: deleteSupabaseRecordMock,
}));

describe("admin availability actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    getAuthenticatedSupabaseUserMock.mockReset();
    getSupabaseRecordMock.mockReset();
    listSupabaseRecordsMock.mockReset();
    createSupabaseRecordMock.mockReset();
    deleteSupabaseRecordMock.mockReset();

    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "user_1",
      businessId: "biz_123",
      businessSlug: "demo-barberia",
      role: "owner",
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
    expect(listSupabaseRecordsMock).not.toHaveBeenCalled();
  });

  it("creates weekly blocked slots and redirects with summary", async () => {
    listSupabaseRecordsMock.mockResolvedValue([]);
    createSupabaseRecordMock.mockResolvedValue({ id: "slot_1" });

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
    expect(createSupabaseRecordMock).toHaveBeenCalled();
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Se agregaron 3 bloqueos"
    );
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("saves availability rules and redirects with day label", async () => {
    listSupabaseRecordsMock.mockResolvedValue([]);
    createSupabaseRecordMock.mockResolvedValue({ id: "rule_1" });

    const { saveAvailabilityRulesAction } = await import("./actions");
    const formData = new FormData();
    formData.set("scope", "day:1");
    formData.set("ruleId_1", "");
    formData.set("active_1", "true");
    formData.set("startTime_1", "09:00");
    formData.set("endTime_1", "18:00");

    await expect(saveAvailabilityRulesAction(formData)).rejects.toThrow("REDIRECT:");
    expect(listSupabaseRecordsMock).toHaveBeenCalled();
  });

  it("removes a blocked slot and redirects", async () => {
    const existingSlot = {
      id: "slot_1",
      business_id: "biz_123",
      blockedDate: "2026-03-20",
      startTime: "13:00",
      endTime: "14:00",
    };
    getSupabaseRecordMock.mockResolvedValue(existingSlot);
    deleteSupabaseRecordMock.mockResolvedValue(undefined);

    const { removeBlockedSlotAction } = await import("./actions");
    const formData = new FormData();
    formData.set("blockedSlotId", "slot_1");
    formData.set("blockedDate", "2026-03-20");
    formData.set("businessSlug", "demo-barberia");

    await expect(removeBlockedSlotAction(formData)).rejects.toThrow("REDIRECT:");
    expect(deleteSupabaseRecordMock).toHaveBeenCalledWith("blocked_slots", "slot_1");
  });
});