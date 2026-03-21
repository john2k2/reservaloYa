import { afterEach, describe, expect, it } from "vitest";

import { isValidMPWebhookSignature, shouldVerifyMPWebhookSignature } from "@/server/mercadopago";

describe("MercadoPago webhook signature", () => {
  const originalSecret = process.env.MP_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MP_WEBHOOK_SECRET;
      return;
    }

    process.env.MP_WEBHOOK_SECRET = originalSecret;
  });

  it("skips signature enforcement when no webhook secret is configured", () => {
    delete process.env.MP_WEBHOOK_SECRET;

    expect(shouldVerifyMPWebhookSignature()).toBe(false);
    expect(
      isValidMPWebhookSignature({
        paymentId: null,
        requestId: null,
        signatureHeader: null,
      })
    ).toBe(true);
  });

  it("accepts a valid MercadoPago signature", () => {
    process.env.MP_WEBHOOK_SECRET = "test_mp_webhook_secret";

    expect(shouldVerifyMPWebhookSignature()).toBe(true);
    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: "ts=1710000000,v1=716593b2f3e2baddb282f90a6ddcf3f2834af7e96025099b28762012a2981d67",
      })
    ).toBe(true);
  });

  it("rejects missing or invalid signature parts when verification is enabled", () => {
    process.env.MP_WEBHOOK_SECRET = "test_mp_webhook_secret";

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: "ts=1710000000,v1=deadbeef",
      })
    ).toBe(false);

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: null,
        signatureHeader: "ts=1710000000,v1=716593b2f3e2baddb282f90a6ddcf3f2834af7e96025099b28762012a2981d67",
      })
    ).toBe(false);
  });
});
