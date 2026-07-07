-- DB-level safety net against double-booking: the app-level lock (booking-slot-lock.ts)
-- has a 15s TTL with no renewal, so a slow request can lose the lock mid-write with no
-- backstop. This EXCLUDE constraint makes overlapping active bookings for the same
-- business impossible to insert/update regardless of application-layer races.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Postgres rejects text::timestamp inside a GENERATED ... STORED expression: the cast
-- is classified STABLE (its parsing depends on the DateStyle setting), not IMMUTABLE,
-- so "generation expression is not immutable" fails at migration time. This helper
-- parses the fixed "YYYY-MM-DD"/"HH:MM" formats manually with only genuinely immutable
-- primitives (split_part, int cast, make_timestamp), so it can be declared IMMUTABLE.
CREATE OR REPLACE FUNCTION booking_datetime(date_text text, time_text text)
RETURNS timestamp
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT make_timestamp(
    split_part(date_text, '-', 1)::int,
    split_part(date_text, '-', 2)::int,
    split_part(date_text, '-', 3)::int,
    split_part(time_text, ':', 1)::int,
    split_part(time_text, ':', 2)::int,
    0
  );
$$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "bookingRange" tsrange
  GENERATED ALWAYS AS (
    tsrange(
      booking_datetime("bookingDate", "startTime"),
      booking_datetime("bookingDate", "endTime"),
      '[)'
    )
  ) STORED;

-- Mirrors the "blocking" status set used by hasBookingConflict() in
-- booking-mutations-domain.ts (pending, pending_payment, confirmed) — completed/cancelled/
-- no_show bookings don't hold the slot and are excluded from the constraint.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap_per_business
  EXCLUDE USING gist (
    business_id WITH =,
    "bookingRange" WITH &&
  ) WHERE (status IN ('pending', 'pending_payment', 'confirmed'));
