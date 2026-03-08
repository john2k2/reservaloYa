import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runLocalBookingReminderSweep } from "@/server/local-store";

function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;

  if (!secret) {
    return !isSupabaseConfigured();
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");

  return bearer === secret || headerSecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "La version live del job se activara cuando conectemos el proveedor final.",
      },
      { status: 501 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { businessSlug?: string; now?: string; dryRun?: boolean }
    | null;

  const result = await runLocalBookingReminderSweep({
    businessSlug: body?.businessSlug,
    now: body?.now,
    dryRun: body?.dryRun,
  });

  return NextResponse.json({ ok: true, result });
}
