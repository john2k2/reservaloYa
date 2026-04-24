import { createHash } from "node:crypto";

import { getSupabaseAdminClient } from "@/server/supabase-store/_core";
import { createLogger } from "@/server/logger";

const logger = createLogger("rate-limit");

type RateLimitBucketConfig = {
  bucket: string;
  identifier: string;
  max: number;
  windowMs: number;
};

type RateLimitBucketState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
  store: "memory" | "supabase";
};

const rateLimitBuckets = new Map<string, RateLimitBucketState>();

function getBucketKey(input: Pick<RateLimitBucketConfig, "bucket" | "identifier">) {
  return `${input.bucket}::${input.identifier}`;
}

function hashIdentifier(input: Pick<RateLimitBucketConfig, "bucket" | "identifier">) {
  return createHash("sha256").update(getBucketKey(input)).digest("hex");
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, state] of rateLimitBuckets.entries()) {
    if (state.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

function consumeMemoryRateLimit(input: RateLimitBucketConfig): RateLimitResult {
  const now = Date.now();

  cleanupExpiredBuckets(now);

  const bucketKey = getBucketKey(input);
  const current = rateLimitBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + input.windowMs });
    return { ok: true, remaining: Math.max(input.max - 1, 0), retryAfterSeconds: 0, store: "memory" };
  }

  if (current.count >= input.max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
      store: "memory",
    };
  }

  current.count += 1;
  return { ok: true, remaining: Math.max(input.max - current.count, 0), retryAfterSeconds: 0, store: "memory" };
}

async function consumeSupabaseRateLimit(input: RateLimitBucketConfig): Promise<RateLimitResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAtIso = new Date(now.getTime() + input.windowMs).toISOString();
  const identifierHash = hashIdentifier(input);
  const client = await getSupabaseAdminClient();

  // best-effort cleanup of expired events
  void client
    .from("rate_limit_events")
    .delete()
    .lte("expiresAt", nowIso);

  const { data: activeEvents, error: selectError } = await client
    .from("rate_limit_events")
    .select("id, expiresAt")
    .eq("bucket", input.bucket)
    .eq("identifierHash", identifierHash)
    .gt("expiresAt", nowIso)
    .limit(input.max + 1);

  if (selectError) throw selectError;

  const count = (activeEvents ?? []).length;

  if (count >= input.max) {
    const earliestReset = (activeEvents ?? []).reduce((min: number, e: { expiresAt: string }) => {
      const t = new Date(e.expiresAt).getTime();
      return Math.min(min, t);
    }, Number.POSITIVE_INFINITY);

    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Number.isFinite(earliestReset)
        ? Math.max(Math.ceil((earliestReset - now.getTime()) / 1000), 1)
        : Math.max(Math.ceil(input.windowMs / 1000), 1),
      store: "supabase",
    };
  }

  const { error: insertError } = await client.from("rate_limit_events").insert({
    bucket: input.bucket,
    identifierHash: identifierHash,
    expiresAt: expiresAtIso,
  });

  if (insertError) throw insertError;

  return {
    ok: true,
    remaining: Math.max(input.max - count - 1, 0),
    retryAfterSeconds: 0,
    store: "supabase",
  };
}

export async function consumeRateLimit(input: RateLimitBucketConfig): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return consumeMemoryRateLimit(input);
  }

  try {
    return await consumeSupabaseRateLimit(input);
  } catch (error) {
    logger.error("Rate limit store no disponible; denegando request en entorno no local", {
      bucket: input.bucket,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil(input.windowMs / 1000), 1),
      store: "supabase",
    };
  }
}

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function assertRateLimit(input: RateLimitBucketConfig & { message: string }) {
  const result = await consumeRateLimit(input);

  if (!result.ok) {
    throw new RateLimitError(input.message, result.retryAfterSeconds);
  }

  return result;
}

export function getRateLimitIdentifier(headers: Headers, fallback = "anonymous") {
  const xForwardedFor = headers.get("x-forwarded-for") ?? "";
  const xRealIp = headers.get("x-real-ip") ?? "";
  const firstForwardedIp = xForwardedFor
    .split(",")
    .map((segment) => segment.trim())
    .find(Boolean);

  return firstForwardedIp || xRealIp.trim() || fallback;
}

export function resetRateLimitStoreForTests() {
  if (process.env.NODE_ENV === "test") {
    rateLimitBuckets.clear();
  }
}
