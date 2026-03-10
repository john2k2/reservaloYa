const bookingLocks = new Map<string, Promise<void>>();

function buildBookingDateLockKey(input: { businessKey: string; bookingDate: string }) {
  return `${input.businessKey}::${input.bookingDate}`;
}

export async function withBookingDateLock<T>(
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

export function resetBookingLocksForTests() {
  if (process.env.NODE_ENV === "test") {
    bookingLocks.clear();
  }
}
