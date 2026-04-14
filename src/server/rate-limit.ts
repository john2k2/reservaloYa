import { createHash } from "node:crypto";

import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import {
  isPocketBaseAdminConfigured,
  isPocketBaseConfigured,
} from "@/lib/pocketbase/config";
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

type RateLimitEventRecord = {
  id: string;
  bucket: string;
  identifierHash: string;
  expiresAt: string;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
  store: "memory" | "pocketbase";
};

const rateLimitBuckets = new Map<string, RateLimitBucketState>();
let lastPocketBaseRateLimitCleanupAt = 0;

function getBucketKey(input: Pick<RateLimitBucketConfig, "bucket" | "identifier">) {
  return `${input.bucket}::${input.identifier}`;
}

function hashIdentifier(input: Pick<RateLimitBucketConfig, "bucket" | "identifier">) {
  return createHash("sha256").update(getBucketKey(input)).digest("hex");
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, state] of rateLimitBuckets.entries()) {
    if (state.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function consumeMemoryRateLimit(input: RateLimitBucketConfig): RateLimitResult {
  const now = Date.now();

  cleanupExpiredBuckets(now);

  const bucketKey = getBucketKey(input);
  const current = rateLimitBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + input.windowMs,
    });

    return {
      ok: true,
      remaining: Math.max(input.max - 1, 0),
      retryAfterSeconds: 0,
      store: "memory",
    };
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

  return {
    ok: true,
    remaining: Math.max(input.max - current.count, 0),
    retryAfterSeconds: 0,
    store: "memory",
  };
}

function shouldUseSharedRateLimitStore() {
  return (
    process.env.NODE_ENV !== "test" &&
    isPocketBaseConfigured() &&
    isPocketBaseAdminConfigured()
  );
}

async function cleanupExpiredPocketBaseRateLimitEvents(nowIso: string) {
  const now = Date.now();

  if (lastPocketBaseRateLimitCleanupAt > now - 5 * 60 * 1000) {
    return;
  }

  lastPocketBaseRateLimitCleanupAt = now;

  try {
    const pb = await createPocketBaseAdminClient();
    const expired = await pb.collection("rate_limit_events").getFullList<RateLimitEventRecord>({
      filter: pb.filter("expiresAt <= {:now}", { now: nowIso }),
      sort: "expiresAt",
      batch: 100,
      requestKey: null,
    });

    await Promise.all(
      expired.slice(0, 100).map((record) =>
        pb.collection("rate_limit_events").delete(record.id)
      )
    );
  } catch {
    // Best-effort cleanup only.
  }
}

async function consumePocketBaseRateLimit(
  input: RateLimitBucketConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAtIso = new Date(now.getTime() + input.windowMs).toISOString();
  const identifierHash = hashIdentifier(input);
  const pb = await createPocketBaseAdminClient();

  void cleanupExpiredPocketBaseRateLimitEvents(nowIso);

  const activeEvents = await pb
    .collection("rate_limit_events")
    .getFullList<RateLimitEventRecord>({
      filter: pb.filter(
        "bucket = {:bucket} && identifierHash = {:identifierHash} && expiresAt > {:now}",
        {
          bucket: input.bucket,
          identifierHash,
          now: nowIso,
        }
      ),
      sort: "expiresAt",
      batch: input.max + 1,
      requestKey: null,
    });

  if (activeEvents.length >= input.max) {
    const earliestResetAt = activeEvents.reduce((current, event) => {
      const eventResetAt = new Date(event.expiresAt).getTime();
      return Math.min(current, eventResetAt);
    }, Number.POSITIVE_INFINITY);

    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Number.isFinite(earliestResetAt)
        ? Math.max(Math.ceil((earliestResetAt - now.getTime()) / 1000), 1)
        : Math.max(Math.ceil(input.windowMs / 1000), 1),
      store: "pocketbase",
    };
  }

  await pb.collection("rate_limit_events").create({
    bucket: input.bucket,
    identifierHash,
    expiresAt: expiresAtIso,
  });

  return {
    ok: true,
    remaining: Math.max(input.max - activeEvents.length - 1, 0),
    retryAfterSeconds: 0,
    store: "pocketbase",
  };
}

export async function consumeRateLimit(
  input: RateLimitBucketConfig
): Promise<RateLimitResult> {
  if (!shouldUseSharedRateLimitStore()) {
    return consumeMemoryRateLimit(input);
  }

  try {
    return await consumePocketBaseRateLimit(input);
  } catch (error) {
    // Si el shared store no está disponible (colección inexistente, credenciales,
    // conectividad), caemos a memoria. En Railway (single instance) y Vercel
    // (serverless, sin estado compartido entre invocaciones) el bypass
    // cross-instance no es un riesgo real.
    logger.warn("Rate limit store no disponible — usando memoria como fallback", {
      bucket: input.bucket,
      message: error instanceof Error ? error.message : String(error),
    });
    return consumeMemoryRateLimit(input);
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

export async function assertRateLimit(
  input: RateLimitBucketConfig & {
    message: string;
  }
) {
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
    lastPocketBaseRateLimitCleanupAt = 0;
  }
}
