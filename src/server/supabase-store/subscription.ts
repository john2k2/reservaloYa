import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "./_core";
import { normalizeSubscriptionPaymentAttempt } from "./helpers";
import { isActiveSubscriptionExpired } from "@/server/payments-domain";
import type { SupabaseSubscriptionPaymentAttempt } from "./types";

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
 * Pasa a `suspended` toda suscripción `active` cuyo `nextBillingDate` venció hace más
 * del período de gracia. Sin esto, `resolveSubscriptionStatus` señaliza `subscriptionExpired`
 * para bloquear el acceso, pero el status real en DB queda `active` para siempre.
 */
export async function runSupabaseSubscriptionBillingSweep(input?: {
  now?: string;
  dryRun?: boolean;
}) {
  const client = await getSupabaseAdminClient();
  const now = input?.now ? new Date(input.now) : new Date();
  const dryRun = Boolean(input?.dryRun);

  const { data: activeSubs } = await client
    .from("subscriptions")
    .select("id, businessId, nextBillingDate")
    .eq("status", "active");

  const overdue = (activeSubs ?? []).filter((sub) =>
    isActiveSubscriptionExpired(sub.nextBillingDate as string | null, now)
  );

  if (!dryRun) {
    for (const sub of overdue) {
      await client.from("subscriptions").update({ status: "suspended" }).eq("id", sub.id);
    }
  }

  return {
    checked: activeSubs?.length ?? 0,
    suspended: overdue.length,
    businessIds: overdue.map((sub) => sub.businessId as string),
  };
}
