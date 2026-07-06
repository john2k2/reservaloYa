import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })));

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

import { runSupabaseSubscriptionBillingSweep } from "./subscription";

describe("runSupabaseSubscriptionBillingSweep", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
    updateMock.mockClear();
  });

  function mockActiveSubs(subs: Array<{ id: string; businessId: string; nextBillingDate: string | null }>) {
    getSupabaseAdminClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: subs, error: null })),
        })),
        update: updateMock,
      })),
    });
  }

  const now = "2026-07-15T12:00:00.000Z";

  it("suspends only active subscriptions overdue past the grace period", async () => {
    mockActiveSubs([
      { id: "sub-current", businessId: "biz-current", nextBillingDate: "2026-07-14T12:00:00.000Z" }, // 1 day overdue, within grace
      { id: "sub-overdue", businessId: "biz-overdue", nextBillingDate: "2026-07-01T12:00:00.000Z" }, // 14 days overdue
    ]);

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toEqual({
      checked: 2,
      suspended: 1,
      businessIds: ["biz-overdue"],
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({ status: "suspended" });
  });

  it("does not write anything in dryRun mode", async () => {
    mockActiveSubs([
      { id: "sub-overdue", businessId: "biz-overdue", nextBillingDate: "2026-07-01T12:00:00.000Z" },
    ]);

    const result = await runSupabaseSubscriptionBillingSweep({ now, dryRun: true });

    expect(result).toEqual({ checked: 1, suspended: 1, businessIds: ["biz-overdue"] });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("does nothing when there are no active subscriptions", async () => {
    mockActiveSubs([]);

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toEqual({ checked: 0, suspended: 0, businessIds: [] });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
