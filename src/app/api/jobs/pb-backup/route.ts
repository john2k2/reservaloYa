import { NextResponse } from "next/server";

import { createLogger } from "@/server/logger";
import { runBackup } from "@/server/pb-backup";

const logger = createLogger("PB Backup Cron");

// Permitir hasta 5 min para un backup grande
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET no configurado");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBackup();
    logger.info("Backup completo", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("Backup falló", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
