import { NextResponse } from "next/server";
import { z } from "zod";

import { trackAnalyticsEvent } from "@/server/analytics";
import { consumeRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import { getPublicAppUrl } from "@/lib/runtime";

const ANALYTICS_LIMIT_MAX = 60;
const ANALYTICS_LIMIT_WINDOW_MS = 60_000;

// The analytics beacon is fired from our own public pages. Requiring the request
// to originate from our host raises the bar against a script that inflates or
// pollutes another tenant's metrics by POSTing a foreign businessSlug directly.
function isSameOrigin(request: Request): boolean {
  const allowedHost = (() => {
    try {
      return new URL(getPublicAppUrl()).host;
    } catch {
      return null;
    }
  })();

  if (!allowedHost) {
    // Misconfigured app URL — fail open only outside production.
    return process.env.NODE_ENV !== "production";
  }

  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) return false;

  try {
    return new URL(source).host === allowedHost;
  } catch {
    return false;
  }
}

const analyticsSchema = z.object({
  businessSlug: z.string().min(2),
  eventName: z.enum(["public_page_view", "booking_cta_clicked", "booking_page_view"]),
  pagePath: z.string().min(1),
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    // Silent no-op so the beacon never surfaces errors to real users.
    return new NextResponse(null, { status: 204 });
  }

  const clientId = getRateLimitIdentifier(request.headers, "analytics");
  const limiterResult = await consumeRateLimit({
    bucket: "analytics",
    identifier: clientId,
    max: ANALYTICS_LIMIT_MAX,
    windowMs: ANALYTICS_LIMIT_WINDOW_MS,
  });

  if (!limiterResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many analytics events. Please retry later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiterResult.retryAfterSeconds),
          "X-RateLimit-Store": limiterResult.store,
        },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = analyticsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await trackAnalyticsEvent(parsed.data);
  } catch {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "X-RateLimit-Store": limiterResult.store,
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "X-RateLimit-Store": limiterResult.store,
    },
  });
}
