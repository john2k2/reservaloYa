import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());
const sendTrialEndingEmailMock = vi.hoisted(() => vi.fn());
const sendDunningEmailMock = vi.hoisted(() => vi.fn());
const sendSubscriptionSuspendedEmailMock = vi.hoisted(() => vi.fn());

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

vi.mock("@/server/booking-notifications", () => ({
  sendTrialEndingEmail: sendTrialEndingEmailMock,
  sendDunningEmail: sendDunningEmailMock,
  sendSubscriptionSuspendedEmail: sendSubscriptionSuspendedEmailMock,
}));

import { runSupabaseSubscriptionBillingSweep } from "./subscription";

type TrialSub = {
  id: string;
  businessId: string;
  trialEndsAt: string | null;
  trialEndingNotifiedAt: string | null;
};
type ActiveSub = {
  id: string;
  businessId: string;
  nextBillingDate: string | null;
  dunningNotifiedAt: string | null;
};

describe("runSupabaseSubscriptionBillingSweep", () => {
  // Records every subscriptions UPDATE so tests can assert markers/status writes.
  let updates: Array<{ payload: Record<string, unknown>; id: string }>;

  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
    updates = [];
    sendTrialEndingEmailMock.mockReset().mockResolvedValue({ status: "sent", messageId: "t1" });
    sendDunningEmailMock.mockReset().mockResolvedValue({ status: "sent", messageId: "d1" });
    sendSubscriptionSuspendedEmailMock.mockReset().mockResolvedValue({ status: "sent", messageId: "s1" });
  });

  function mockClient(opts: {
    trialSubs?: TrialSub[];
    activeSubs?: ActiveSub[];
    businessesById?: Record<string, { name: string | null; email: string | null }>;
  }) {
    const trialSubs = opts.trialSubs ?? [];
    const activeSubs = opts.activeSubs ?? [];
    const businessesById = opts.businessesById ?? {};

    getSupabaseAdminClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "businesses") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((_col: string, id: string) => ({
                maybeSingle: vi.fn(() =>
                  Promise.resolve({ data: businessesById[id] ?? null, error: null })
                ),
              })),
            })),
          };
        }
        // subscriptions
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, value: string) =>
              Promise.resolve({ data: value === "trial" ? trialSubs : activeSubs, error: null })
            ),
          })),
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn((_col: string, id: string) => {
              updates.push({ payload, id });
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }),
    });
  }

  const now = "2026-07-15T12:00:00.000Z";

  it("suspends subscriptions overdue past grace and emails them", async () => {
    mockClient({
      activeSubs: [
        { id: "sub-current", businessId: "biz-current", nextBillingDate: "2026-07-16T12:00:00.000Z", dunningNotifiedAt: null },
        { id: "sub-overdue", businessId: "biz-overdue", nextBillingDate: "2026-07-01T12:00:00.000Z", dunningNotifiedAt: null },
      ],
      businessesById: { "biz-overdue": { name: "Barberia Overdue", email: "owner@example.com" } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({
      checked: 2,
      suspended: 1,
      suspensionNotified: 1,
      dunningNotified: 0,
      trialEndingNotified: 0,
      businessIds: ["biz-overdue"],
    });
    expect(updates).toContainEqual({ payload: { status: "suspended" }, id: "sub-overdue" });
    expect(sendSubscriptionSuspendedEmailMock).toHaveBeenCalledWith({
      businessName: "Barberia Overdue",
      businessEmail: "owner@example.com",
    });
  });

  it("sends a dunning email once and marks dunningNotifiedAt for overdue-within-grace subs", async () => {
    mockClient({
      activeSubs: [
        { id: "sub-dun", businessId: "biz-dun", nextBillingDate: "2026-07-14T12:00:00.000Z", dunningNotifiedAt: null },
      ],
      businessesById: { "biz-dun": { name: "Barberia Dun", email: "dun@example.com" } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({ suspended: 0, dunningNotified: 1 });
    expect(sendDunningEmailMock).toHaveBeenCalledWith({
      businessName: "Barberia Dun",
      businessEmail: "dun@example.com",
    });
    expect(updates).toContainEqual({ payload: { dunningNotifiedAt: now }, id: "sub-dun" });
  });

  it("does not re-send dunning when already marked", async () => {
    mockClient({
      activeSubs: [
        { id: "sub-dun", businessId: "biz-dun", nextBillingDate: "2026-07-14T12:00:00.000Z", dunningNotifiedAt: "2026-07-14T15:00:00.000Z" },
      ],
      businessesById: { "biz-dun": { name: "Barberia Dun", email: "dun@example.com" } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({ dunningNotified: 0 });
    expect(sendDunningEmailMock).not.toHaveBeenCalled();
  });

  it("emails trials ending soon once and marks trialEndingNotifiedAt", async () => {
    mockClient({
      trialSubs: [
        { id: "sub-trial", businessId: "biz-trial", trialEndsAt: "2026-07-17T12:00:00.000Z", trialEndingNotifiedAt: null },
        { id: "sub-trial-far", businessId: "biz-far", trialEndsAt: "2026-07-30T12:00:00.000Z", trialEndingNotifiedAt: null },
      ],
      businessesById: { "biz-trial": { name: "Barberia Trial", email: "trial@example.com" } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({ trialChecked: 2, trialEndingNotified: 1 });
    expect(sendTrialEndingEmailMock).toHaveBeenCalledWith({
      businessName: "Barberia Trial",
      businessEmail: "trial@example.com",
      daysLeft: 2,
    });
    expect(updates).toContainEqual({ payload: { trialEndingNotifiedAt: now }, id: "sub-trial" });
  });

  it("writes and sends nothing in dryRun mode", async () => {
    mockClient({
      trialSubs: [
        { id: "sub-trial", businessId: "biz-trial", trialEndsAt: "2026-07-17T12:00:00.000Z", trialEndingNotifiedAt: null },
      ],
      activeSubs: [
        { id: "sub-overdue", businessId: "biz-overdue", nextBillingDate: "2026-07-01T12:00:00.000Z", dunningNotifiedAt: null },
      ],
      businessesById: {
        "biz-trial": { name: "T", email: "t@example.com" },
        "biz-overdue": { name: "O", email: "o@example.com" },
      },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now, dryRun: true });

    expect(result).toMatchObject({ suspended: 1, suspensionNotified: 0, dunningNotified: 0, trialEndingNotified: 0 });
    expect(updates).toHaveLength(0);
    expect(sendTrialEndingEmailMock).not.toHaveBeenCalled();
    expect(sendDunningEmailMock).not.toHaveBeenCalled();
    expect(sendSubscriptionSuspendedEmailMock).not.toHaveBeenCalled();
  });

  it("still suspends when the business has no email and does not mark it notified", async () => {
    mockClient({
      activeSubs: [
        { id: "sub-overdue", businessId: "biz-overdue", nextBillingDate: "2026-07-01T12:00:00.000Z", dunningNotifiedAt: null },
      ],
      businessesById: { "biz-overdue": { name: "Sin Email", email: null } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({ suspended: 1, suspensionNotified: 0 });
    expect(updates).toContainEqual({ payload: { status: "suspended" }, id: "sub-overdue" });
    expect(sendSubscriptionSuspendedEmailMock).not.toHaveBeenCalled();
  });

  it("does not mark dunning notified when the email send fails", async () => {
    sendDunningEmailMock.mockRejectedValue(new Error("resend down"));
    mockClient({
      activeSubs: [
        { id: "sub-dun", businessId: "biz-dun", nextBillingDate: "2026-07-14T12:00:00.000Z", dunningNotifiedAt: null },
      ],
      businessesById: { "biz-dun": { name: "Barberia Dun", email: "dun@example.com" } },
    });

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({ dunningNotified: 0 });
    expect(updates).not.toContainEqual({ payload: { dunningNotifiedAt: now }, id: "sub-dun" });
  });

  it("does nothing when there are no subscriptions", async () => {
    mockClient({});

    const result = await runSupabaseSubscriptionBillingSweep({ now });

    expect(result).toMatchObject({
      checked: 0,
      trialChecked: 0,
      suspended: 0,
      suspensionNotified: 0,
      dunningNotified: 0,
      trialEndingNotified: 0,
      businessIds: [],
    });
    expect(updates).toHaveLength(0);
  });
});
