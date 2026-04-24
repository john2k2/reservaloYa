import { getSupabaseAdminClient } from "@/server/supabase-store/_core";
import { createLogger } from "@/server/logger";

const logger = createLogger("booking-lock");

const bookingLocks = new Map<string, Promise<void>>();
const SHARED_LOCK_TTL_MS = 15_000;
const SHARED_LOCK_RETRY_MS = 75;
const SHARED_LOCK_TIMEOUT_MS = 5_000;
const SHARED_LOCK_CLEANUP_INTERVAL_MS = 60_000;

let lastSharedLockCleanupAt = 0;

type SharedLockHandle = { id: string };

function buildBookingDateLockKey(input: { businessKey: string; bookingDate: string }) {
  return `${input.businessKey}::${input.bookingDate}`;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function cleanupExpiredSharedBookingLocks() {
  const now = Date.now();
  if (lastSharedLockCleanupAt > now - SHARED_LOCK_CLEANUP_INTERVAL_MS) return;
  lastSharedLockCleanupAt = now;

  try {
    const client = await getSupabaseAdminClient();
    await client
      .from("booking_locks")
      .delete()
      .lte("expiresAt", new Date(now).toISOString());
  } catch {
    // best-effort cleanup
  }
}

async function acquireSharedBookingLock(lockKey: string): Promise<SharedLockHandle> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SHARED_LOCK_TIMEOUT_MS) {
    void cleanupExpiredSharedBookingLocks();

    try {
      const client = await getSupabaseAdminClient();
      const { data, error } = await client
        .from("booking_locks")
        .insert({
          lockKey: lockKey,
          expiresAt: new Date(Date.now() + SHARED_LOCK_TTL_MS).toISOString(),
        })
        .select("id")
        .single();

      if (!error && data) {
        return { id: data.id };
      }

      // Unique constraint violation — slot is locked, retry
      if (error?.code === "23505") {
        await wait(SHARED_LOCK_RETRY_MS);
        continue;
      }

      throw error;
    } catch (error) {
      const pgError = error as { code?: string } | null;
      if (pgError?.code === "23505") {
        await wait(SHARED_LOCK_RETRY_MS);
        continue;
      }
      throw error;
    }
  }

  throw new Error("No pudimos bloquear el horario a tiempo. Intenta nuevamente.");
}

async function releaseSharedBookingLock(handle: SharedLockHandle) {
  try {
    const client = await getSupabaseAdminClient();
    await client.from("booking_locks").delete().eq("id", handle.id);
  } catch {
    // expiration handles eventual cleanup
  }
}

async function withMemoryBookingDateLock<T>(
  input: { businessKey: string; bookingDate: string },
  operation: () => Promise<T>
) {
  const lockKey = buildBookingDateLockKey(input);
  const previous = bookingLocks.get(lockKey) ?? Promise.resolve();

  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  const tail = previous.then(() => current);
  bookingLocks.set(lockKey, tail);

  try {
    await previous;
    return await operation();
  } finally {
    release?.();
    if (bookingLocks.get(lockKey) === tail) {
      bookingLocks.delete(lockKey);
    }
  }
}

export async function withBookingDateLock<T>(
  input: { businessKey: string; bookingDate: string },
  operation: () => Promise<T>
) {
  if (process.env.NODE_ENV === "test") {
    return withMemoryBookingDateLock(input, operation);
  }

  const lockKey = buildBookingDateLockKey(input);

  try {
    const handle = await acquireSharedBookingLock(lockKey);
    try {
      return await operation();
    } finally {
      await releaseSharedBookingLock(handle);
    }
  } catch (error) {
    const pgError = error as { code?: string; message?: string } | null;
    const canUseLocalFallback = process.env.NODE_ENV === "development";

    if (
      canUseLocalFallback &&
      (pgError?.code === "42P01" || pgError?.message?.includes("does not exist"))
    ) {
      logger.error("booking_locks table missing, falling back to memory lock in development");
      return withMemoryBookingDateLock(input, operation);
    }

    logger.error("No se pudo adquirir el lock compartido de booking", {
      lockKey,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function resetBookingLocksForTests() {
  if (process.env.NODE_ENV === "test") {
    bookingLocks.clear();
    lastSharedLockCleanupAt = 0;
  }
}
