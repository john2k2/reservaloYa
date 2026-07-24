import { NextResponse } from "next/server";

import { runSupabaseSubscriptionBillingSweep } from "@/server/supabase-store";
import { createLogger } from "@/server/logger";
import { isAuthorized } from "@/server/cron-auth";

const logger = createLogger("Subscription Billing Job");

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

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun");
    const result = await runBillingJob({
      now: url.searchParams.get("now") ?? undefined,
      dryRun: dryRun === "1" || dryRun === "true",
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    // El detalle del error queda en el log interno; al cliente solo se le
    // devuelve un mensaje genérico para no filtrar información interna.
    logger.error("Falló el job de facturación de suscripciones", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { now?: string; dryRun?: boolean }
      | null;
    const result = await runBillingJob(body);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error("Falló el job de facturación de suscripciones", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
