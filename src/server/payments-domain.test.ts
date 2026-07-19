import { describe, expect, it, vi } from "vitest";

import {
  buildBookingPaymentPatch,
  buildBusinessMercadoPagoTokenClearPatch,
  buildBusinessMercadoPagoTokenPatch,
  buildBusinessPaymentSettings,
  isActiveSubscriptionInDunning,
  isTrialEndingSoon,
  normalizeMercadoPagoCollectorId,
  trialDaysLeft,
} from "@/server/payments-domain";

vi.mock("@/server/mp-token-crypto", () => ({
  encryptMPToken: vi.fn((s: string) => s),
  decryptMPToken: vi.fn((s: string) => s),
}));

describe("payments domain helpers", () => {
  it("builds normalized business payment settings", () => {
    expect(
      buildBusinessPaymentSettings({
        id: "biz-1",
        slug: "demo-barberia",
        name: "Demo Barberia",
        mpCollectorId: "collector-1",
      })
    ).toEqual({
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      mpConnected: false,
      mpCollectorId: "collector-1",
      mpAccessToken: undefined,
      mpRefreshToken: undefined,
      mpTokenExpiresAt: undefined,
    });
  });

  it("builds a confirmed booking patch when payment is approved", () => {
    expect(
      buildBookingPaymentPatch({
        bookingId: "booking-1",
        paymentStatus: "approved",
        paymentAmount: 18000,
        paymentCurrency: "ARS",
        paymentProvider: "mercadopago",
        paymentExternalId: "pay-1",
      })
    ).toEqual({
      paymentStatus: "approved",
      paymentAmount: 18000,
      paymentCurrency: "ARS",
      paymentProvider: "mercadopago",
      paymentExternalId: "pay-1",
      status: "confirmed",
    });
  });

  it("normalizes collector ids and builds Mercado Pago token patches", () => {
    expect(normalizeMercadoPagoCollectorId(" collector-1 ")).toBe("collector-1");
    expect(normalizeMercadoPagoCollectorId("   ")).toBeNull();

    expect(
      buildBusinessMercadoPagoTokenPatch({
        mpAccessToken: "access-1",
        mpRefreshToken: "refresh-1",
        mpCollectorId: "collector-1",
        mpTokenExpiresAt: "2026-03-27T12:00:00.000Z",
      })
    ).toEqual({
      mpAccessToken: "access-1",
      mpRefreshToken: "refresh-1",
      mpCollectorId: "collector-1",
      mpTokenExpiresAt: "2026-03-27T12:00:00.000Z",
      mpConnected: true,
    });

    expect(buildBusinessMercadoPagoTokenClearPatch(undefined)).toEqual({
      mpAccessToken: undefined,
      mpRefreshToken: undefined,
      mpCollectorId: undefined,
      mpTokenExpiresAt: undefined,
      mpConnected: false,
    });

    expect(buildBusinessMercadoPagoTokenClearPatch("")).toEqual({
      mpAccessToken: "",
      mpRefreshToken: "",
      mpCollectorId: "",
      mpTokenExpiresAt: "",
      mpConnected: false,
    });
  });

  describe("subscription lifecycle predicates", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");

    it("flags a trial ending within the notice window but not one further out or past", () => {
      expect(isTrialEndingSoon("2026-07-17T12:00:00.000Z", now)).toBe(true); // 2 days left
      expect(isTrialEndingSoon("2026-07-15T18:00:00.000Z", now)).toBe(true); // same day
      expect(isTrialEndingSoon("2026-07-20T12:00:00.000Z", now)).toBe(false); // 5 days out
      expect(isTrialEndingSoon("2026-07-14T12:00:00.000Z", now)).toBe(false); // already expired
      expect(isTrialEndingSoon(null, now)).toBe(false);
    });

    it("computes whole days left, clamped at zero", () => {
      expect(trialDaysLeft("2026-07-17T12:00:00.000Z", now)).toBe(2);
      expect(trialDaysLeft("2026-07-15T20:00:00.000Z", now)).toBe(1);
      expect(trialDaysLeft("2026-07-10T12:00:00.000Z", now)).toBe(0);
      expect(trialDaysLeft(null, now)).toBe(0);
    });

    it("flags dunning only when overdue but still within the grace period", () => {
      expect(isActiveSubscriptionInDunning("2026-07-14T12:00:00.000Z", now)).toBe(true); // 1 day overdue, within 3-day grace
      expect(isActiveSubscriptionInDunning("2026-07-16T12:00:00.000Z", now)).toBe(false); // not overdue yet
      expect(isActiveSubscriptionInDunning("2026-07-01T12:00:00.000Z", now)).toBe(false); // past grace → suspend, not dunning
      expect(isActiveSubscriptionInDunning(null, now)).toBe(false);
    });
  });
});
