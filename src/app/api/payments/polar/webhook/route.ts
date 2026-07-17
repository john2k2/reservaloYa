import { Webhooks } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

import {
  getPolarWebhookSecret,
  isPolarWebhookConfigured,
} from "@/server/polar-config";
import {
  handlePolarOrderPaid,
  handlePolarSubscriptionActive,
  handlePolarSubscriptionCanceled,
  handlePolarSubscriptionRevoked,
  handlePolarSubscriptionUpdated,
} from "@/server/polar-subscription";
import { createLogger } from "@/server/logger";

const logger = createLogger("PolarWebhook");

export async function POST(request: NextRequest) {
  if (!isPolarWebhookConfigured()) {
    return NextResponse.json({ error: "polar_webhook_not_configured" }, { status: 503 });
  }

  const webhookSecret = getPolarWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "polar_webhook_not_configured" }, { status: 503 });
  }

  const handler = Webhooks({
    webhookSecret,
    onSubscriptionActive: async (payload) => {
      const result = await handlePolarSubscriptionActive(payload.data);
      if (!result.ok) {
        logger.error("Falló subscription.active", result);
      }
    },
    onOrderPaid: async (payload) => {
      const result = await handlePolarOrderPaid(payload.data);
      if (!result.ok) {
        logger.error("Falló order.paid", result);
      }
    },
    onSubscriptionCanceled: async (payload) => {
      const result = await handlePolarSubscriptionCanceled(payload.data);
      if (!result.ok) {
        logger.error("Falló subscription.canceled", result);
      }
    },
    onSubscriptionRevoked: async (payload) => {
      const result = await handlePolarSubscriptionRevoked(payload.data);
      if (!result.ok) {
        logger.error("Falló subscription.revoked", result);
      }
    },
    onSubscriptionUpdated: async (payload) => {
      const result = await handlePolarSubscriptionUpdated(payload.data);
      if (!result.ok) {
        logger.error("Falló subscription.updated", result);
      }
    },
  });

  return handler(request);
}
