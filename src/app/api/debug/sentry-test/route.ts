/**
 * Endpoint temporal para validar que Sentry captura errores en producción.
 * BORRAR después de confirmar que el issue aparece en el dashboard de Sentry.
 *
 * Uso:
 *   curl "https://reservaya.ar/api/debug/sentry-test?key=$CRON_SECRET"
 */
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  throw new Error("Sentry validation — ignorar, es intencional");
}
