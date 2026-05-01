import { getSupabaseAdminClient } from "./_core";
import { slugify } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl } from "@/lib/runtime";
import type { BusinessRecord, BookingRecord, ServiceRecord, CustomerRecord, WaitlistEntryRecord } from "@/server/supabase-domain";
import type { JoinedBookingWithBusiness, SupabaseSubscriptionPaymentAttempt } from "./types";

export async function getBusinessBySlug(slug: string) {
  const client = await getSupabaseAdminClient();
  const normalizedSlug = slugify(slug);
  const { data, error } = await client
    .from("businesses")
    .select("*")
    .eq("slug", normalizedSlug)
    .single();
  if (error || !data) throw new Error("Business not found");
  return data as BusinessRecord;
}

export async function getBusinessByIdWithClient(
  client: Awaited<ReturnType<typeof createServerClient>>,
  id: string
) {
  const { data, error } = await client.from("businesses").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Business not found");
  return data as BusinessRecord;
}


export async function notifyWaitlistForDate(input: {
  businessId: string;
  businessSlug: string;
  businessName: string;
  bookingDate: string;
}) {
  const client = await getSupabaseAdminClient();

  const { data: entries } = await client
    .from("waitlist_entries")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("bookingDate", input.bookingDate)
    .eq("notified", false)
    .order("created", { ascending: true })
    .limit(1);

  const entry = entries?.[0] as WaitlistEntryRecord | undefined;
  if (!entry?.email) return;

  const { sendWaitlistAvailabilityEmail } = await import("@/server/booking-notifications");
  const bookingUrl = `${getPublicAppUrl()}/${input.businessSlug}/reservar`;

  await sendWaitlistAvailabilityEmail({
    customerEmail: entry.email,
    customerName: entry.fullName,
    businessName: input.businessName,
    bookingDate: input.bookingDate,
    bookingUrl,
  });

  await client.from("waitlist_entries").update({ notified: true }).eq("id", entry.id);
}


export async function resolveSubscriptionStatus(
  client: Awaited<ReturnType<typeof createServerClient>>,
  businessId: string
): Promise<{
  subscriptionStatus: "trial" | "active" | "cancelled" | "suspended";
  subscriptionExpired: boolean;
}> {
  const { data: sub, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) {
    return { subscriptionStatus: "trial", subscriptionExpired: false };
  }

  const status = sub.status as "trial" | "active" | "cancelled" | "suspended";

  if (status === "active") {
    return { subscriptionStatus: "active", subscriptionExpired: false };
  }

  if (status === "trial") {
    const expired = sub.trialEndsAt ? new Date(sub.trialEndsAt) < new Date() : false;
    return { subscriptionStatus: "trial", subscriptionExpired: expired };
  }

  if (status === "cancelled") {
    const stillActive = sub.nextBillingDate ? new Date(sub.nextBillingDate) > new Date() : false;
    return { subscriptionStatus: "cancelled", subscriptionExpired: !stillActive };
  }

  return { subscriptionStatus: status, subscriptionExpired: true };
}


export function normalizeSubscriptionPaymentAttempt(
  attempt: SupabaseSubscriptionPaymentAttempt
): SupabaseSubscriptionPaymentAttempt {
  return {
    ...attempt,
    amountArs: Number(attempt.amountArs),
    blueRate: attempt.blueRate == null ? null : Number(attempt.blueRate),
  };
}


