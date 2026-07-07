-- DB-level safety net against double-booking: the app-level lock (booking-slot-lock.ts)
-- has a 15s TTL with no renewal, so a slow request can lose the lock mid-write with no
-- backstop. This EXCLUDE constraint makes overlapping active bookings for the same
-- business impossible to insert/update regardless of application-layer races.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "bookingRange" tsrange
  GENERATED ALWAYS AS (
    tsrange(
      ("bookingDate" || ' ' || "startTime")::timestamp,
      ("bookingDate" || ' ' || "endTime")::timestamp,
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
