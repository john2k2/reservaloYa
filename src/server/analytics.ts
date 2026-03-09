"use server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { trackPocketBaseAnalyticsEvent } from "@/server/pocketbase-store";
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
  if (!isPocketBaseConfigured()) {
    await trackLocalAnalyticsEvent(input);
    return;
  }

  await trackPocketBaseAnalyticsEvent(input);
}
