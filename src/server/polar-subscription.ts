import {
  activateSupabaseSubscription,
  getSupabaseSubscriptionByPolarId,
  markSupabaseSubscriptionCancelledAtPeriodEnd,
  renewSupabaseSubscription,
  suspendSupabaseSubscription,
} from "@/server/supabase-store/subscription";
import { createLogger } from "@/server/logger";

const logger = createLogger("PolarSubscription");

export type PolarCustomerLike = {
  id: string;
  externalId?: string | null;
};

export type PolarSubscriptionLike = {
  id: string;
  customerId: string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd?: boolean;
  status?: string;
  customer?: PolarCustomerLike | null;
  metadata?: Record<string, unknown> | null;
};

export type PolarOrderLike = {
  billingReason: string;
  customerId: string;
  subscriptionId?: string | null;
  customer?: PolarCustomerLike | null;
  subscription?: {
    id: string;
    currentPeriodEnd: Date | string;
    customerId?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
};

function metadataBusinessId(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const value = metadata.businessId ?? metadata.business_id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function resolveBusinessIdFromPolar(input: {
  customerExternalId?: string | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const fromCustomer = input.customerExternalId?.trim();
  if (fromCustomer) return fromCustomer;
  return metadataBusinessId(input.metadata);
}

async function resolveBusinessIdForSubscription(
  subscription: PolarSubscriptionLike
): Promise<string | null> {
  const fromPayload = resolveBusinessIdFromPolar({
    customerExternalId: subscription.customer?.externalId,
    metadata: subscription.metadata,
  });
  if (fromPayload) return fromPayload;

  const existing = await getSupabaseSubscriptionByPolarId(subscription.id);
  return existing?.businessId ?? null;
}

export async function handlePolarSubscriptionActive(subscription: PolarSubscriptionLike) {
  const businessId = await resolveBusinessIdForSubscription(subscription);
  if (!businessId) {
    logger.error("subscription.active sin businessId resoluble", { polarId: subscription.id });
    return { ok: false as const, reason: "business_not_found" };
  }

  await activateSupabaseSubscription(businessId, {
    nextBillingDate: subscription.currentPeriodEnd,
    polarSubscriptionId: subscription.id,
    polarCustomerId: subscription.customer?.id ?? subscription.customerId,
  });

  return { ok: true as const, businessId };
}

export async function handlePolarOrderPaid(order: PolarOrderLike) {
  const renewReasons = new Set(["subscription_create", "subscription_cycle", "subscription_update"]);
  if (!renewReasons.has(order.billingReason)) {
    return { ok: true as const, skipped: true as const, reason: "ignored_billing_reason" };
  }

  if (!order.subscription?.currentPeriodEnd) {
    logger.error("order.paid sin subscription.currentPeriodEnd", {
      billingReason: order.billingReason,
      subscriptionId: order.subscriptionId,
    });
    return { ok: false as const, reason: "missing_period_end" };
  }

  const businessId =
    resolveBusinessIdFromPolar({
      customerExternalId: order.customer?.externalId,
      metadata: order.metadata,
    }) ??
    (order.subscriptionId
      ? (await getSupabaseSubscriptionByPolarId(order.subscriptionId))?.businessId
      : null);

  if (!businessId) {
    logger.error("order.paid sin businessId resoluble", {
      subscriptionId: order.subscriptionId,
      billingReason: order.billingReason,
    });
    return { ok: false as const, reason: "business_not_found" };
  }

  await renewSupabaseSubscription(businessId, {
    nextBillingDate: order.subscription.currentPeriodEnd,
    polarSubscriptionId: order.subscription.id,
    polarCustomerId: order.customer?.id ?? order.customerId,
  });

  return { ok: true as const, businessId, skipped: false as const };
}

export async function handlePolarSubscriptionRevoked(subscription: PolarSubscriptionLike) {
  const businessId = await resolveBusinessIdForSubscription(subscription);
  if (!businessId) {
    logger.error("subscription.revoked sin businessId resoluble", { polarId: subscription.id });
    return { ok: false as const, reason: "business_not_found" };
  }

  await suspendSupabaseSubscription(businessId);
  return { ok: true as const, businessId };
}

export async function handlePolarSubscriptionCanceled(subscription: PolarSubscriptionLike) {
  const businessId = await resolveBusinessIdForSubscription(subscription);
  if (!businessId) {
    logger.error("subscription.canceled sin businessId resoluble", { polarId: subscription.id });
    return { ok: false as const, reason: "business_not_found" };
  }

  // Cancelación al fin de período: acceso hasta current_period_end.
  await markSupabaseSubscriptionCancelledAtPeriodEnd(
    businessId,
    subscription.currentPeriodEnd
  );
  return { ok: true as const, businessId };
}

export async function handlePolarSubscriptionPastDue(subscription: PolarSubscriptionLike) {
  const businessId = await resolveBusinessIdForSubscription(subscription);
  if (!businessId) {
    logger.error("subscription.past_due sin businessId resoluble", { polarId: subscription.id });
    return { ok: false as const, reason: "business_not_found" };
  }

  await suspendSupabaseSubscription(businessId);
  return { ok: true as const, businessId };
}

export async function handlePolarSubscriptionUpdated(subscription: PolarSubscriptionLike) {
  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return handlePolarSubscriptionPastDue(subscription);
  }
  return { ok: true as const, skipped: true as const };
}
