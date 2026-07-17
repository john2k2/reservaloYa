import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  activateSupabaseSubscriptionMock,
  renewSupabaseSubscriptionMock,
  suspendSupabaseSubscriptionMock,
  markSupabaseSubscriptionCancelledAtPeriodEndMock,
  getSupabaseSubscriptionByPolarIdMock,
} = vi.hoisted(() => ({
  activateSupabaseSubscriptionMock: vi.fn(),
  renewSupabaseSubscriptionMock: vi.fn(),
  suspendSupabaseSubscriptionMock: vi.fn(),
  markSupabaseSubscriptionCancelledAtPeriodEndMock: vi.fn(),
  getSupabaseSubscriptionByPolarIdMock: vi.fn(),
}));

vi.mock("@/server/supabase-store/subscription", () => ({
  activateSupabaseSubscription: activateSupabaseSubscriptionMock,
  renewSupabaseSubscription: renewSupabaseSubscriptionMock,
  suspendSupabaseSubscription: suspendSupabaseSubscriptionMock,
  markSupabaseSubscriptionCancelledAtPeriodEnd: markSupabaseSubscriptionCancelledAtPeriodEndMock,
  getSupabaseSubscriptionByPolarId: getSupabaseSubscriptionByPolarIdMock,
}));

vi.mock("@/server/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("polar-subscription handlers", () => {
  beforeEach(() => {
    activateSupabaseSubscriptionMock.mockReset();
    renewSupabaseSubscriptionMock.mockReset();
    suspendSupabaseSubscriptionMock.mockReset();
    markSupabaseSubscriptionCancelledAtPeriodEndMock.mockReset();
    getSupabaseSubscriptionByPolarIdMock.mockReset();
  });

  it("activa con businessId desde customer.externalId", async () => {
    const { handlePolarSubscriptionActive } = await import("./polar-subscription");

    const result = await handlePolarSubscriptionActive({
      id: "sub_polar_1",
      customerId: "cus_1",
      currentPeriodEnd: new Date("2026-08-14T00:00:00.000Z"),
      customer: { id: "cus_1", externalId: "biz-1" },
    });

    expect(result).toEqual({ ok: true, businessId: "biz-1" });
    expect(activateSupabaseSubscriptionMock).toHaveBeenCalledWith("biz-1", {
      nextBillingDate: new Date("2026-08-14T00:00:00.000Z"),
      polarSubscriptionId: "sub_polar_1",
      polarCustomerId: "cus_1",
    });
  });

  it("renueva en order.paid con subscription_cycle", async () => {
    const { handlePolarOrderPaid } = await import("./polar-subscription");

    const result = await handlePolarOrderPaid({
      billingReason: "subscription_cycle",
      customerId: "cus_1",
      subscriptionId: "sub_polar_1",
      customer: { id: "cus_1", externalId: "biz-1" },
      subscription: {
        id: "sub_polar_1",
        currentPeriodEnd: new Date("2026-09-14T00:00:00.000Z"),
      },
    });

    expect(result).toMatchObject({ ok: true, businessId: "biz-1", skipped: false });
    expect(renewSupabaseSubscriptionMock).toHaveBeenCalledWith("biz-1", {
      nextBillingDate: new Date("2026-09-14T00:00:00.000Z"),
      polarSubscriptionId: "sub_polar_1",
      polarCustomerId: "cus_1",
    });
  });

  it("ignora order.paid con billing_reason purchase", async () => {
    const { handlePolarOrderPaid } = await import("./polar-subscription");

    const result = await handlePolarOrderPaid({
      billingReason: "purchase",
      customerId: "cus_1",
      customer: { id: "cus_1", externalId: "biz-1" },
      subscription: null,
    });

    expect(result).toMatchObject({ ok: true, skipped: true });
    expect(renewSupabaseSubscriptionMock).not.toHaveBeenCalled();
  });

  it("suspende en revoked", async () => {
    const { handlePolarSubscriptionRevoked } = await import("./polar-subscription");
    getSupabaseSubscriptionByPolarIdMock.mockResolvedValue({ businessId: "biz-9" });

    const result = await handlePolarSubscriptionRevoked({
      id: "sub_polar_9",
      customerId: "cus_9",
      currentPeriodEnd: new Date("2026-08-01T00:00:00.000Z"),
      customer: { id: "cus_9" },
    });

    expect(result).toEqual({ ok: true, businessId: "biz-9" });
    expect(suspendSupabaseSubscriptionMock).toHaveBeenCalledWith("biz-9");
  });

  it("cancela al fin de período en canceled", async () => {
    const { handlePolarSubscriptionCanceled } = await import("./polar-subscription");

    const result = await handlePolarSubscriptionCanceled({
      id: "sub_polar_2",
      customerId: "cus_2",
      currentPeriodEnd: new Date("2026-08-20T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
      customer: { id: "cus_2", externalId: "biz-2" },
    });

    expect(result).toEqual({ ok: true, businessId: "biz-2" });
    expect(markSupabaseSubscriptionCancelledAtPeriodEndMock).toHaveBeenCalledWith(
      "biz-2",
      new Date("2026-08-20T00:00:00.000Z")
    );
  });

  it("suspende en updated con status past_due", async () => {
    const { handlePolarSubscriptionUpdated } = await import("./polar-subscription");

    const result = await handlePolarSubscriptionUpdated({
      id: "sub_polar_3",
      customerId: "cus_3",
      status: "past_due",
      currentPeriodEnd: new Date("2026-08-01T00:00:00.000Z"),
      customer: { id: "cus_3", externalId: "biz-3" },
    });

    expect(result).toEqual({ ok: true, businessId: "biz-3" });
    expect(suspendSupabaseSubscriptionMock).toHaveBeenCalledWith("biz-3");
  });
});
