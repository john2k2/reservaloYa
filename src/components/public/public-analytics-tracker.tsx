"use client";

import { useEffect } from "react";

import { sendPublicAnalyticsEvent } from "@/components/public/public-analytics-client";

type PublicAnalyticsTrackerProps = {
  businessSlug: string;
  eventName: "public_page_view" | "booking_page_view";
  pagePath: string;
};

export function PublicAnalyticsTracker({
  businessSlug,
  eventName,
  pagePath,
}: Readonly<PublicAnalyticsTrackerProps>) {
  useEffect(() => {
    sendPublicAnalyticsEvent({
      businessSlug,
      eventName,
      pagePath,
    });
  }, [businessSlug, eventName, pagePath]);

  return null;
}
