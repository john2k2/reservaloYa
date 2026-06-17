-- Indexes to improve list and filter performance across the main tables.

CREATE INDEX IF NOT EXISTS idx_bookings_business_date_status
  ON bookings (business_id, "bookingDate", status);

CREATE INDEX IF NOT EXISTS idx_bookings_business_status_start
  ON bookings (business_id, status, "startTime");

CREATE INDEX IF NOT EXISTS idx_customers_business_email
  ON customers (business_id, email);

CREATE INDEX IF NOT EXISTS idx_customers_business_phone
  ON customers (business_id, phone);

CREATE INDEX IF NOT EXISTS idx_services_business_id
  ON services (business_id);

CREATE INDEX IF NOT EXISTS idx_availability_rules_business_day
  ON availability_rules (business_id, "dayOfWeek");

CREATE INDEX IF NOT EXISTS idx_blocked_slots_business_date
  ON blocked_slots (business_id, "blockedDate");

CREATE INDEX IF NOT EXISTS idx_comm_events_business_booking
  ON communication_events (business_id, booking_id);

CREATE INDEX IF NOT EXISTS idx_comm_events_business_kind_status
  ON communication_events (business_id, kind, status);

CREATE INDEX IF NOT EXISTS idx_analytics_events_business_event_created
  ON analytics_events (business_id, "eventName", created);
