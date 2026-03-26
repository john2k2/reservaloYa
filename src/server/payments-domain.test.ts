import { describe, expect, it } from "vitest";

import { buildBookingPaymentPatch, buildBusinessPaymentSettings } from "@/server/payments-domain";

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
});
