import { NextResponse } from "next/server";

import { isDemoModeEnabled } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { runLocalBookingReminderSweep } from "@/server/local-store";
import { getPocketBaseBusinessBySlug, runPocketBaseBookingReminderSweep } from "@/server/pocketbase-store";

function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const expectedSecrets = [secret, cronSecret].filter(Boolean);

  if (expectedSecrets.length === 0) {
    return !isPocketBaseConfigured() && isDemoModeEnabled();
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");
  const userAgent = request.headers.get("user-agent") ?? "";
  const matchesExpectedSecret = (candidate: string | null | undefined) =>
    candidate ? expectedSecrets.includes(candidate) : false;

  return (
    matchesExpectedSecret(bearer) ||
    matchesExpectedSecret(headerSecret) ||
    (userAgent === "vercel-cron/1.0" && expectedSecrets.length > 0)
  );
}

async function runReminderJob(body: { businessSlug?: string; now?: string; dryRun?: boolean } | null) {
  return isPocketBaseConfigured()
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
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun");
  const body = {
    businessSlug: url.searchParams.get("businessSlug") ?? undefined,
    now: url.searchParams.get("now") ?? undefined,
    dryRun: dryRun === "1" || dryRun === "true",
  };
  const result = await runReminderJob(body);

  return NextResponse.json({ ok: true, result });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { businessSlug?: string; now?: string; dryRun?: boolean }
    | null;
  const result = await runReminderJob(body);

  return NextResponse.json({ ok: true, result });
}
