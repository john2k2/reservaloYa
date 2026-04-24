CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  kind TEXT NOT NULL CHECK (kind IN ('confirmation', 'reminder', 'followup')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  recipient TEXT,
  subject TEXT,
  note TEXT
);

ALTER TABLE communication_events ENABLE ROW LEVEL SECURITY;
