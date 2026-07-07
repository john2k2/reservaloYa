import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { finishJobRun, runSupabaseBookingReminderSweep, startJobRun } from "@/server/supabase-store";

// Vercel Hobby's default function window is short; this cron can outgrow a
// naive sequential sweep as booking volume grows, so give it a bounded but
// generous budget rather than relying on the platform default.
export const maxDuration = 60;

const JOB_NAME = "booking-reminders";

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

async function runReminderJob(body: { businessId?: string; now?: string; dryRun?: boolean } | null) {
  const dryRun = Boolean(body?.dryRun);
  const runId = dryRun ? null : await startJobRun(JOB_NAME);

  try {
    const result = await runSupabaseBookingReminderSweep({
      businessId: body?.businessId,
      now: body?.now,
      dryRun,
    });

    if (runId) {
      await finishJobRun(runId, "completed", { summary: result });
    }

    return result;
  } catch (err) {
    if (runId) {
      await finishJobRun(runId, "failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    throw err;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun");
    const result = await runReminderJob({
      businessId: url.searchParams.get("businessId") ?? undefined,
      now: url.searchParams.get("now") ?? undefined,
      dryRun: dryRun === "1" || dryRun === "true",
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { businessId?: string; now?: string; dryRun?: boolean }
      | null;
    const result = await runReminderJob(body);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
