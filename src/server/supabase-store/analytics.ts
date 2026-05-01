import { slugify } from "@/lib/utils";
import type { AnalyticsRecord, BusinessRecord } from "@/server/supabase-domain";
import { getSupabaseAdminClient, createSupabaseRecord } from "./_core";

export async function trackSupabaseAnalyticsEvent(input: {
  businessSlug: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  const client = await getSupabaseAdminClient();
  const normalizedSlug = slugify(input.businessSlug);

  const { data: businessData, error: businessError } = await client
    .from("businesses")
    .select("id")
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .single();

  if (businessError || !businessData) {
    return;
  }
  const business = businessData as BusinessRecord;

  await createSupabaseRecord<AnalyticsRecord>("analytics_events", {
    business_id: business.id,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}


export async function trackSupabaseAnalyticsEventByBusinessId(input: {
  businessId: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  await createSupabaseRecord<AnalyticsRecord>("analytics_events", {
    business_id: input.businessId,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}

