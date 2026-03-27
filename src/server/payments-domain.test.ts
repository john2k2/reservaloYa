import { describe, expect, it } from "vitest";

import {
  buildBookingPaymentPatch,
  buildBusinessMercadoPagoTokenClearPatch,
  buildBusinessMercadoPagoTokenPatch,
  buildBusinessPaymentSettings,
  normalizeMercadoPagoCollectorId,
} from "@/server/payments-domain";

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
});
