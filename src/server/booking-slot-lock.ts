import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import {
  isPocketBaseAdminConfigured,
  isPocketBaseConfigured,
} from "@/lib/pocketbase/config";

const bookingLocks = new Map<string, Promise<void>>();
const SHARED_LOCK_COLLECTION = "booking_locks";
const SHARED_LOCK_TTL_MS = 15_000;
const SHARED_LOCK_RETRY_MS = 75;
const SHARED_LOCK_TIMEOUT_MS = 5_000;
const SHARED_LOCK_CLEANUP_INTERVAL_MS = 60_000;

let lastSharedLockCleanupAt = 0;

type BookingLockRecord = {
  id: string;
  lockKey: string;
  expiresAt: string;
};

type SharedLockHandle = {
  id: string;
};

function buildBookingDateLockKey(input: { businessKey: string; bookingDate: string }) {
  return `${input.businessKey}::${input.bookingDate}`;
}

function shouldUseSharedBookingLock() {
  return (
    process.env.NODE_ENV !== "test" &&
    isPocketBaseConfigured() &&
    isPocketBaseAdminConfigured()
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getPocketBaseErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return null;
}

function isPocketBaseCollectionMissingError(error: unknown) {
  return getPocketBaseErrorStatus(error) === 404;
}

function isPocketBaseDuplicateLockError(error: unknown) {
  if (getPocketBaseErrorStatus(error) !== 400) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /unique|duplicate|already exists|validation_not_unique/i.test(message);
}

async function cleanupExpiredSharedBookingLocks(pb: Awaited<ReturnType<typeof createPocketBaseAdminClient>>) {
  const now = Date.now();

  if (lastSharedLockCleanupAt > now - SHARED_LOCK_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastSharedLockCleanupAt = now;

  try {
    const expiredLocks = await pb.collection(SHARED_LOCK_COLLECTION).getFullList<BookingLockRecord>({
      filter: pb.filter("expiresAt <= {:now}", { now: new Date(now).toISOString() }),
      sort: "expiresAt",
      batch: 100,
      requestKey: null,
    });

    await Promise.all(
      expiredLocks.slice(0, 100).map((record) =>
        pb.collection(SHARED_LOCK_COLLECTION).delete(record.id)
      )
    );
  } catch {
    // Best-effort cleanup only.
  }
}

async function acquireSharedBookingLock(lockKey: string): Promise<SharedLockHandle> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SHARED_LOCK_TIMEOUT_MS) {
    const pb = await createPocketBaseAdminClient();
    await cleanupExpiredSharedBookingLocks(pb);

    try {
      const record = await pb.collection(SHARED_LOCK_COLLECTION).create<BookingLockRecord>({
        lockKey,
        expiresAt: new Date(Date.now() + SHARED_LOCK_TTL_MS).toISOString(),
      });

      return {
        id: record.id,
      };
    } catch (error) {
      if (isPocketBaseCollectionMissingError(error)) {
        throw error;
      }

      if (!isPocketBaseDuplicateLockError(error)) {
        throw error;
      }
    }

    await wait(SHARED_LOCK_RETRY_MS);
  }

  throw new Error("No pudimos bloquear el horario a tiempo. Intenta nuevamente.");
}

async function releaseSharedBookingLock(handle: SharedLockHandle) {
  try {
    const pb = await createPocketBaseAdminClient();
    await pb.collection(SHARED_LOCK_COLLECTION).delete(handle.id);
  } catch {
    // Expiration + cleanup cover eventual failures.
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
  if (!shouldUseSharedBookingLock()) {
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
    if (isPocketBaseCollectionMissingError(error)) {
      console.error(
        "[booking-lock] booking_locks collection is missing, falling back to memory lock"
      );
      return withMemoryBookingDateLock(input, operation);
    }

    throw error;
  }
}

export function resetBookingLocksForTests() {
  if (process.env.NODE_ENV === "test") {
    bookingLocks.clear();
    lastSharedLockCleanupAt = 0;
  }
}
