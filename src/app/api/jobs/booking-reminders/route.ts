import { NextResponse } from "next/server";

import { finishJobRun, runSupabaseBookingReminderSweep, startJobRun } from "@/server/supabase-store";
import { createLogger } from "@/server/logger";
import { isAuthorized } from "@/server/cron-auth";

const logger = createLogger("Booking Reminders Job");

// Vercel Hobby's default function window is short; this cron can outgrow a
// naive sequential sweep as booking volume grows, so give it a bounded but
// generous budget rather than relying on the platform default.
export const maxDuration = 60;

const JOB_NAME = "booking-reminders";

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
    // El detalle del error queda en el log interno; al cliente solo se le
    // devuelve un mensaje genérico para no filtrar información interna.
    logger.error("Falló el job de recordatorios", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
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
    logger.error("Falló el job de recordatorios", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
