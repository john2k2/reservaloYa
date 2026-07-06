import { describe, expect, it } from "vitest";

import { resolveSubscriptionStatus } from "./helpers";

function fakeClientFor(sub: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => (sub ? { data: sub, error: null } : { data: null, error: new Error("not found") }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof resolveSubscriptionStatus>[0];
}

describe("resolveSubscriptionStatus", () => {
  it("defaults to trial/not-expired when no subscription row exists", async () => {
    const result = await resolveSubscriptionStatus(fakeClientFor(null), "biz-1");
    expect(result).toEqual({ subscriptionStatus: "trial", subscriptionExpired: false });
  });

  it("trial: expired once trialEndsAt is in the past", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "trial", trialEndsAt: past }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "trial", subscriptionExpired: true });
  });

  it("trial: not expired while trialEndsAt is in the future", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "trial", trialEndsAt: future }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "trial", subscriptionExpired: false });
  });

  it("active: not expired when nextBillingDate is within the grace period", async () => {
    const barelyPast = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1h overdue, grace is 3 days
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "active", nextBillingDate: barelyPast }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "active", subscriptionExpired: false });
  });

  it("active: expired once nextBillingDate is past the grace period", async () => {
    const wayPast = new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(); // 4 days overdue
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "active", nextBillingDate: wayPast }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "active", subscriptionExpired: true });
  });

  it("active: not expired when nextBillingDate is missing (avoids blocking on bad data)", async () => {
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "active", nextBillingDate: null }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "active", subscriptionExpired: false });
  });

  it("cancelled: not expired while nextBillingDate (paid-through date) is in the future", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "cancelled", nextBillingDate: future }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "cancelled", subscriptionExpired: false });
  });

  it("cancelled: expired once nextBillingDate is in the past", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = await resolveSubscriptionStatus(
      fakeClientFor({ status: "cancelled", nextBillingDate: past }),
      "biz-1"
    );
    expect(result).toEqual({ subscriptionStatus: "cancelled", subscriptionExpired: true });
  });

  it("suspended: always expired", async () => {
    const result = await resolveSubscriptionStatus(fakeClientFor({ status: "suspended" }), "biz-1");
    expect(result).toEqual({ subscriptionStatus: "suspended", subscriptionExpired: true });
  });
});
