"use server";

import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { trackLocalAnalyticsEvent } from "@/server/local-store";

export type AnalyticsEventInput = {
  businessSlug: string;
  eventName: "public_page_view" | "booking_cta_clicked" | "booking_page_view" | "booking_created";
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
};

export async function trackAnalyticsEvent(input: AnalyticsEventInput) {
  if (!isSupabaseConfigured()) {
    await trackLocalAnalyticsEvent(input);
    return;
  }

  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", input.businessSlug)
    .eq("active", true)
    .maybeSingle();

  if (!business) {
    return;
  }

  await supabase.from("analytics_events").insert({
    business_id: business.id,
    event_name: input.eventName,
    page_path: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}
