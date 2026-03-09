import { NextResponse } from "next/server";

import { isDemoModeEnabled } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { runLocalBookingReminderSweep } from "@/server/local-store";
import { getPocketBaseBusinessBySlug, runPocketBaseBookingReminderSweep } from "@/server/pocketbase-store";

function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;

  if (!secret) {
    return !isPocketBaseConfigured() && isDemoModeEnabled();
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");

  return bearer === secret || headerSecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { businessSlug?: string; now?: string; dryRun?: boolean }
    | null;
  const result = isPocketBaseConfigured()
    ? await (async () => {
        const business = body?.businessSlug
          ? await getPocketBaseBusinessBySlug(body.businessSlug)
          : null;

        return runPocketBaseBookingReminderSweep({
          businessId: business?.id,
          now: body?.now,
          dryRun: body?.dryRun,
        });
      })()
    : await runLocalBookingReminderSweep({
        businessSlug: body?.businessSlug,
        now: body?.now,
        dryRun: body?.dryRun,
      });

  return NextResponse.json({ ok: true, result });
}
