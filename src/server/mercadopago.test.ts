import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { isValidMPWebhookSignature, shouldVerifyMPWebhookSignature } from "@/server/mercadopago";

const TEST_SECRET = "test_mp_webhook_secret";

function buildSignatureHeader({
  paymentId,
  requestId,
  timestampSeconds,
}: {
  paymentId: string;
  requestId: string;
  timestampSeconds: number;
}) {
  const ts = String(timestampSeconds);
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac("sha256", TEST_SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${hash}`;
}

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
    process.env.MP_WEBHOOK_SECRET = TEST_SECRET;

    const timestampSeconds = Math.floor(Date.now() / 1000);

    expect(shouldVerifyMPWebhookSignature()).toBe(true);
    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: buildSignatureHeader({
          paymentId: "123456",
          requestId: "req-789",
          timestampSeconds,
        }),
      })
    ).toBe(true);
  });

  it("rejects a valid signature with a stale timestamp", () => {
    process.env.MP_WEBHOOK_SECRET = TEST_SECRET;

    const timestampSeconds = Math.floor(Date.now() / 1000) - 600;

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: buildSignatureHeader({
          paymentId: "123456",
          requestId: "req-789",
          timestampSeconds,
        }),
      })
    ).toBe(false);
  });

  it("rejects a valid signature with a timestamp too far in the future", () => {
    process.env.MP_WEBHOOK_SECRET = TEST_SECRET;

    const timestampSeconds = Math.floor(Date.now() / 1000) + 600;

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: buildSignatureHeader({
          paymentId: "123456",
          requestId: "req-789",
          timestampSeconds,
        }),
      })
    ).toBe(false);
  });

  it("rejects missing or invalid signature parts when verification is enabled", () => {
    process.env.MP_WEBHOOK_SECRET = TEST_SECRET;

    const timestampSeconds = Math.floor(Date.now() / 1000);

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: "req-789",
        signatureHeader: `ts=${timestampSeconds},v1=deadbeef`,
      })
    ).toBe(false);

    expect(
      isValidMPWebhookSignature({
        paymentId: "123456",
        requestId: null,
        signatureHeader: buildSignatureHeader({
          paymentId: "123456",
          requestId: "req-789",
          timestampSeconds,
        }),
      })
    ).toBe(false);
  });
});
