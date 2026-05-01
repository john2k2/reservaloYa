import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "./_core";
import { resolveSubscriptionStatus, normalizeSubscriptionPaymentAttempt } from "./helpers";
import type { SupabaseSubscriptionPaymentAttempt } from "./types";

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
    created: sub.created as string,
  };
}

export async function getSupabaseSubscriptionByBusinessId(businessId: string) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("subscriptions")
    .select("id, status, businessId")
    .eq("businessId", businessId)
    .single();

  if (error || !data) return null;
  return data as { id: string; status: string; businessId: string };
}

export async function activateSupabaseSubscription(businessId: string) {
  const client = await getSupabaseAdminClient();

  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  const { error } = await client
    .from("subscriptions")
    .update({
      status: "active",
      nextBillingDate: nextBillingDate.toISOString(),
    })
    .eq("businessId", businessId);

  if (error) throw new Error("No se pudo activar la suscripción.");
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
