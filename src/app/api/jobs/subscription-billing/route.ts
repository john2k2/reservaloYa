import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { runSupabaseSubscriptionBillingSweep } from "@/server/supabase-store";

function timingSafeEqualString(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const expectedSecrets = [secret, cronSecret].filter((value): value is string => Boolean(value));

  if (expectedSecrets.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");
  const matchesExpectedSecret = (candidate: string | null | undefined) =>
    candidate ? expectedSecrets.some((expected) => timingSafeEqualString(candidate, expected)) : false;

  return matchesExpectedSecret(bearer) || matchesExpectedSecret(headerSecret);
}

async function runBillingJob(body: { now?: string; dryRun?: boolean } | null) {
  return runSupabaseSubscriptionBillingSweep({
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
  const result = await runBillingJob({
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
    | { now?: string; dryRun?: boolean }
    | null;
  const result = await runBillingJob(body);

  return NextResponse.json({ ok: true, result });
}
