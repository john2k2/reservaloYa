type PublicAnalyticsEventName =
  | "public_page_view"
  | "booking_cta_clicked"
  | "booking_page_view";

type SendPublicAnalyticsEventInput = {
  businessSlug: string;
  eventName: PublicAnalyticsEventName;
  pagePath: string;
};

export function sendPublicAnalyticsEvent(input: SendPublicAnalyticsEventInput) {
  const params = new URLSearchParams(window.location.search);
  const payload = {
    businessSlug: input.businessSlug,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
  };
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
