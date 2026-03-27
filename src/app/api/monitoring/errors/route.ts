import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import { createLogger } from "@/server/logger";

const logger = createLogger("monitoring");

const MONITORING_LIMIT_MAX = 20;
const MONITORING_LIMIT_WINDOW_MS = 60_000;

const monitoringPayloadSchema = z.object({
  source: z.enum(["window-error", "unhandledrejection", "global-error-boundary"]),
  message: z.string().min(1).max(500),
  stack: z.string().max(4000).optional(),
  pathname: z.string().max(300).optional(),
  userAgent: z.string().max(600).optional(),
  timestamp: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const limiterResult = await consumeRateLimit({
    bucket: "client-monitoring-errors",
    identifier: getRateLimitIdentifier(request.headers, "client-monitoring"),
    max: MONITORING_LIMIT_MAX,
    windowMs: MONITORING_LIMIT_WINDOW_MS,
  });

  if (!limiterResult.ok) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Retry-After": String(limiterResult.retryAfterSeconds),
      },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = monitoringPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  logger.error("Client-side error captured", parsed.data);

  return new NextResponse(null, {
    status: 204,
  });
}
