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

type SupabaseRpcRateLimitRow = {
  ok?: boolean;
  remaining?: number;
  retryAfterSeconds?: number;
  retry_after_seconds?: number;
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

function normalizeRpcRateLimitResult(
  data: SupabaseRpcRateLimitRow | SupabaseRpcRateLimitRow[] | null,
  input: RateLimitBucketConfig
): RateLimitResult {
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row.ok !== "boolean" || typeof row.remaining !== "number") {
    throw new Error("Respuesta invalida de consume_rate_limit.");
  }

  const retryAfterSeconds =
    typeof row.retryAfterSeconds === "number"
      ? row.retryAfterSeconds
      : typeof row.retry_after_seconds === "number"
        ? row.retry_after_seconds
        : row.ok
          ? 0
          : Math.max(Math.ceil(input.windowMs / 1000), 1);

  return {
    ok: row.ok,
    remaining: Math.max(row.remaining, 0),
    retryAfterSeconds,
    store: "supabase",
  };
}

async function consumeSupabaseRateLimitViaRpc(input: RateLimitBucketConfig): Promise<RateLimitResult> {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client.rpc("consume_rate_limit", {
    p_bucket: input.bucket,
    p_identifier_hash: hashIdentifier(input),
    p_max: input.max,
    p_window_ms: input.windowMs,
  });

  if (error) throw error;

  return normalizeRpcRateLimitResult(data as SupabaseRpcRateLimitRow | SupabaseRpcRateLimitRow[] | null, input);
}

export async function consumeRateLimit(input: RateLimitBucketConfig): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return consumeMemoryRateLimit(input);
  }

  try {
    // La RPC consume_rate_limit es atomica y existe via migracion
    // (supabase/migrations/20260424000000_add_booking_locks_rate_limit_events.sql).
    // Si no esta disponible el entorno esta roto: fail-closed, sin fallback
    // SELECT-then-INSERT (no atomico, vulnerable a TOCTOU).
    return await consumeSupabaseRateLimitViaRpc(input);
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

function firstHeaderIp(headers: Headers, name: string): string | undefined {
  return (headers.get(name) ?? "")
    .split(",")
    .map((segment) => segment.trim())
    .find(Boolean);
}

export function getRateLimitIdentifier(headers: Headers, fallback = "anonymous") {
  // x-vercel-forwarded-for lo calcula el edge de Vercel y no es falsificable
  // por el cliente; preferirlo siempre cuando este presente.
  const vercelForwardedFor = firstHeaderIp(headers, "x-vercel-forwarded-for");
  if (vercelForwardedFor) return vercelForwardedFor;

  if (process.env.NODE_ENV === "production") {
    // En produccion x-forwarded-for/x-real-ip solo son confiables si la
    // request paso por el edge (algun header x-vercel-* presente). Si no,
    // son falsificables: usar un bucket generico para evitar rotacion.
    const passedThroughEdge = Boolean(headers.get("x-vercel-id") || headers.get("x-vercel-ip-country"));
    if (!passedThroughEdge) return "unknown-ip";
  }

  const forwardedFor = firstHeaderIp(headers, "x-forwarded-for");
  const xRealIp = headers.get("x-real-ip") ?? "";

  return forwardedFor || xRealIp.trim() || fallback;
}

export function resetRateLimitStoreForTests() {
  if (process.env.NODE_ENV === "test") {
    rateLimitBuckets.clear();
  }
}
