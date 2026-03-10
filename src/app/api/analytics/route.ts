import { NextResponse } from "next/server";
import { z } from "zod";

import { trackAnalyticsEvent } from "@/server/analytics";
import { consumeRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";

const ANALYTICS_LIMIT_MAX = 60;
const ANALYTICS_LIMIT_WINDOW_MS = 60_000;

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
