"use server";

import { trackSupabaseAnalyticsEvent } from "@/server/supabase-store";

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
  await trackSupabaseAnalyticsEvent(input);
}
