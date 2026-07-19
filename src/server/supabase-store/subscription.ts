import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "./_core";
import { normalizeSubscriptionPaymentAttempt } from "./helpers";
import {
  isActiveSubscriptionExpired,
  isActiveSubscriptionInDunning,
  isTrialEndingSoon,
  trialDaysLeft,
} from "@/server/payments-domain";
import { createLogger } from "@/server/logger";
import type { SupabaseSubscriptionPaymentAttempt } from "./types";

const billingLogger = createLogger("Subscription Billing");

export type ActivateSubscriptionOptions = {
  nextBillingDate?: string | Date | null;
  polarSubscriptionId?: string | null;
  polarCustomerId?: string | null;
};

function toIsoDate(value?: string | Date | null): string {
  if (!value) {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    return nextBillingDate.toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

export async function getSupabaseSubscriptionData(businessId: string) {
  const client = await createServerClient();
  const { data: sub } = await client
    .from("subscriptions")
    .select("*")
    .eq("businessId", businessId)
    .single();

  if (!sub) {
    return null;
  }

  return {
    status: sub.status as "trial" | "active" | "cancelled" | "suspended",
    trialEndsAt: sub.trialEndsAt as string | null,
    nextBillingDate: sub.nextBillingDate as string | null,
    mpSubscriptionId: sub.mpSubscriptionId as string | null,
    polarSubscriptionId: sub.polarSubscriptionId as string | null,
    polarCustomerId: sub.polarCustomerId as string | null,
    created: sub.created as string,
  };
}

export async function getSupabaseSubscriptionByBusinessId(businessId: string) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscriptions")
    .select("id, status, businessId, polarSubscriptionId, polarCustomerId, nextBillingDate")
    .eq("businessId", businessId)
    .single();

  if (error || !data) return null;
  return data as {
    id: string;
    status: string;
    businessId: string;
    polarSubscriptionId: string | null;
    polarCustomerId: string | null;
    nextBillingDate: string | null;
  };
}

export async function getSupabaseSubscriptionByPolarId(polarSubscriptionId: string) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscriptions")
    .select("id, status, businessId, polarSubscriptionId, polarCustomerId, nextBillingDate")
    .eq("polarSubscriptionId", polarSubscriptionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    status: string;
    businessId: string;
    polarSubscriptionId: string | null;
    polarCustomerId: string | null;
    nextBillingDate: string | null;
  };
}

export async function activateSupabaseSubscription(
  businessId: string,
  opts: ActivateSubscriptionOptions = {}
) {
  const client = await getSupabaseAdminClient();

  const update: Record<string, unknown> = {
    status: "active",
    nextBillingDate: toIsoDate(opts.nextBillingDate),
    lockedAt: null,
    // Clear the dunning marker so a future overdue cycle notifies again.
    dunningNotifiedAt: null,
  };

  if (opts.polarSubscriptionId !== undefined) {
    update.polarSubscriptionId = opts.polarSubscriptionId;
  }
  if (opts.polarCustomerId !== undefined) {
    update.polarCustomerId = opts.polarCustomerId;
  }

  const { error } = await client
    .from("subscriptions")
    .update(update)
    .eq("businessId", businessId);

  if (error) throw new Error("No se pudo activar la suscripción.");
}

export async function renewSupabaseSubscription(
  businessId: string,
  opts: {
    nextBillingDate: string | Date;
    polarSubscriptionId?: string | null;
    polarCustomerId?: string | null;
  }
) {
  const client = await getSupabaseAdminClient();

  const update: Record<string, unknown> = {
    status: "active",
    nextBillingDate: toIsoDate(opts.nextBillingDate),
    lockedAt: null,
    // Clear the dunning marker so a future overdue cycle notifies again.
    dunningNotifiedAt: null,
  };

  if (opts.polarSubscriptionId !== undefined) {
    update.polarSubscriptionId = opts.polarSubscriptionId;
  }
  if (opts.polarCustomerId !== undefined) {
    update.polarCustomerId = opts.polarCustomerId;
  }

  const { error } = await client
    .from("subscriptions")
    .update(update)
    .eq("businessId", businessId);

  if (error) throw new Error("No se pudo renovar la suscripción.");
}

export async function suspendSupabaseSubscription(businessId: string) {
  const client = await getSupabaseAdminClient();
  const { error } = await client
    .from("subscriptions")
    .update({ status: "suspended" })
    .eq("businessId", businessId);

  if (error) throw new Error("No se pudo suspender la suscripción.");
}

export async function markSupabaseSubscriptionCancelledAtPeriodEnd(
  businessId: string,
  nextBillingDate?: string | Date | null
) {
  const client = await getSupabaseAdminClient();
  const update: Record<string, unknown> = {
    status: "cancelled",
  };
  if (nextBillingDate) {
    update.nextBillingDate = toIsoDate(nextBillingDate);
  }

  const { error } = await client
    .from("subscriptions")
    .update(update)
    .eq("businessId", businessId);

  if (error) throw new Error("No se pudo cancelar la suscripción.");
}

export async function createSupabaseSubscriptionPaymentAttempt(input: {
  businessId: string;
  preferenceId: string;
  amountArs: number;
  currency?: string;
  blueRate?: number | null;
  status?: SupabaseSubscriptionPaymentAttempt["status"];
}) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscription_payment_attempts")
    .insert({
      businessId: input.businessId,
      preferenceId: input.preferenceId,
      amountArs: input.amountArs,
      currency: input.currency ?? "ARS",
      blueRate: input.blueRate ?? null,
      status: input.status ?? "pending",
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo registrar el intento de pago.");
  return normalizeSubscriptionPaymentAttempt(data as SupabaseSubscriptionPaymentAttempt);
}

export async function listSupabaseSubscriptionPaymentAttempts(businessId: string) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscription_payment_attempts")
    .select("*")
    .eq("businessId", businessId)
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as SupabaseSubscriptionPaymentAttempt[]).map(
    normalizeSubscriptionPaymentAttempt
  );
}

export async function getSupabaseSubscriptionPaymentAttemptForWebhook(input: {
  businessId: string;
  preferenceId?: string | null;
}) {
  const client = await getSupabaseAdminClient();

  if (input.preferenceId) {
    const { data } = await client
      .from("subscription_payment_attempts")
      .select("*")
      .eq("businessId", input.businessId)
      .eq("preferenceId", input.preferenceId)
      .single();

    if (data) return normalizeSubscriptionPaymentAttempt(data as SupabaseSubscriptionPaymentAttempt);
  }

  const { data } = await client
    .from("subscription_payment_attempts")
    .select("*")
    .eq("businessId", input.businessId)
    .eq("status", "pending")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  return data ? normalizeSubscriptionPaymentAttempt(data as SupabaseSubscriptionPaymentAttempt) : null;
}

export async function updateSupabaseSubscriptionPaymentAttemptStatus(input: {
  attemptId: string;
  status: SupabaseSubscriptionPaymentAttempt["status"];
  paymentId?: string | null;
}) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscription_payment_attempts")
    .update({
      status: input.status,
      paymentId: input.paymentId ?? null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", input.attemptId)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar el intento de pago.");
  return normalizeSubscriptionPaymentAttempt(data as SupabaseSubscriptionPaymentAttempt);
}

export async function cancelSupabaseSubscription(businessId: string) {
  const client = await createServerClient();

  const { data: sub, error } = await client
    .from("subscriptions")
    .select("id, status, nextBillingDate")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) {
    throw new Error("No encontramos la suscripción.");
  }

  if (sub.status === "cancelled") {
    throw new Error("La suscripción ya está cancelada.");
  }

  if (sub.status === "suspended") {
    throw new Error("No se puede cancelar una suscripción suspendida.");
  }

  await client
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", sub.id);
}

/**
 * Fetches a business's contact and delivers a lifecycle email best-effort.
 * Returns true only when the email was actually sent, so the caller can persist
 * the dedup marker. A missing email or any failure returns false (never throws).
 */
async function notifyBusiness(
  client: Awaited<ReturnType<typeof getSupabaseAdminClient>>,
  businessId: string,
  send: (contact: { businessName: string; businessEmail: string }) => Promise<{ status: string }>
): Promise<boolean> {
  try {
    const { data: business } = await client
      .from("businesses")
      .select("name, email")
      .eq("id", businessId)
      .maybeSingle();

    const email = (business?.email as string | null)?.trim();
    if (!email) return false;

    const result = await send({
      businessName: (business?.name as string | null) ?? "tu negocio",
      businessEmail: email,
    });
    return result.status === "sent";
  } catch (err) {
    billingLogger.error("Failed to notify business", err);
    return false;
  }
}

/**
 * Daily billing sweep. Three lifecycle passes, all best-effort on the email side:
 *  1. Trial ending soon → nudge the owner to subscribe (once, via `trialEndingNotifiedAt`).
 *  2. Payment overdue but within grace → dunning reminder (once per cycle, via `dunningNotifiedAt`).
 *  3. Overdue past grace → suspend + notify. Suspension is naturally idempotent
 *     (the sub leaves the `active` set once suspended).
 *
 * Suspension keeps DB status in sync with `resolveSubscriptionStatus`, which otherwise
 * would signal `subscriptionExpired` while the row stayed `active` forever.
 */
export async function runSupabaseSubscriptionBillingSweep(input?: {
  now?: string;
  dryRun?: boolean;
}) {
  const client = await getSupabaseAdminClient();
  const now = input?.now ? new Date(input.now) : new Date();
  const dryRun = Boolean(input?.dryRun);

  const { data: trialSubs } = await client
    .from("subscriptions")
    .select("id, businessId, trialEndsAt, trialEndingNotifiedAt")
    .eq("status", "trial");

  const trialEnding = (trialSubs ?? []).filter(
    (sub) =>
      !sub.trialEndingNotifiedAt && isTrialEndingSoon(sub.trialEndsAt as string | null, now)
  );

  const { data: activeSubs } = await client
    .from("subscriptions")
    .select("id, businessId, nextBillingDate, dunningNotifiedAt")
    .eq("status", "active");

  const overdue = (activeSubs ?? []).filter((sub) =>
    isActiveSubscriptionExpired(sub.nextBillingDate as string | null, now)
  );
  const dunning = (activeSubs ?? []).filter(
    (sub) =>
      !sub.dunningNotifiedAt && isActiveSubscriptionInDunning(sub.nextBillingDate as string | null, now)
  );

  let trialEndingNotified = 0;
  let dunningNotified = 0;
  let suspensionNotified = 0;

  if (!dryRun) {
    // Lazy import keeps the email stack out of the supabase-store barrel's
    // module-load path (a static import bloats every barrel consumer).
    const notifications = await import("@/server/booking-notifications");
    const nowIso = now.toISOString();

    for (const sub of trialEnding) {
      const sent = await notifyBusiness(client, sub.businessId as string, (contact) =>
        notifications.sendTrialEndingEmail({
          ...contact,
          daysLeft: trialDaysLeft(sub.trialEndsAt as string | null, now),
        })
      );
      if (sent) {
        await client
          .from("subscriptions")
          .update({ trialEndingNotifiedAt: nowIso })
          .eq("id", sub.id);
        trialEndingNotified += 1;
      }
    }

    for (const sub of dunning) {
      const sent = await notifyBusiness(client, sub.businessId as string, (contact) =>
        notifications.sendDunningEmail(contact)
      );
      if (sent) {
        await client
          .from("subscriptions")
          .update({ dunningNotifiedAt: nowIso })
          .eq("id", sub.id);
        dunningNotified += 1;
      }
    }

    for (const sub of overdue) {
      await client.from("subscriptions").update({ status: "suspended" }).eq("id", sub.id);
      const sent = await notifyBusiness(client, sub.businessId as string, (contact) =>
        notifications.sendSubscriptionSuspendedEmail(contact)
      );
      if (sent) suspensionNotified += 1;
    }
  }

  return {
    checked: activeSubs?.length ?? 0,
    trialChecked: trialSubs?.length ?? 0,
    suspended: overdue.length,
    suspensionNotified,
    trialEndingNotified,
    dunningNotified,
    businessIds: overdue.map((sub) => sub.businessId as string),
  };
}
