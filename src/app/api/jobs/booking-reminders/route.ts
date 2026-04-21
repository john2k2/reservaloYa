import { NextResponse } from "next/server";

import { runSupabaseBookingReminderSweep } from "@/server/supabase-store";

function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const expectedSecrets = [secret, cronSecret].filter(Boolean);

  if (expectedSecrets.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");
  const matchesExpectedSecret = (candidate: string | null | undefined) =>
    candidate ? expectedSecrets.includes(candidate) : false;

  return matchesExpectedSecret(bearer) || matchesExpectedSecret(headerSecret);
}

async function runReminderJob(body: { businessId?: string; now?: string; dryRun?: boolean } | null) {
  return runSupabaseBookingReminderSweep({
    businessId: body?.businessId,
    now: body?.now,
    dryRun: body?.dryRun,
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun");
  const result = await runReminderJob({
    businessId: url.searchParams.get("businessId") ?? undefined,
    now: url.searchParams.get("now") ?? undefined,
    dryRun: dryRun === "1" || dryRun === "true",
  });

  return NextResponse.json({ ok: true, result });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { businessId?: string; now?: string; dryRun?: boolean }
    | null;
  const result = await runReminderJob(body);

  return NextResponse.json({ ok: true, result });
}
