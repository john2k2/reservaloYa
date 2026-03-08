import { NextResponse } from "next/server";
import { z } from "zod";

import { trackAnalyticsEvent } from "@/server/analytics";

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
  const body = await request.json().catch(() => null);
  const parsed = analyticsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await trackAnalyticsEvent(parsed.data);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}
