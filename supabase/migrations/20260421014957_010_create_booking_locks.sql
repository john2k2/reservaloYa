CREATE TABLE IF NOT EXISTS booking_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  "lockKey" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_locks_lock_key ON booking_locks ("lockKey");

ALTER TABLE booking_locks ENABLE ROW LEVEL SECURITY;
