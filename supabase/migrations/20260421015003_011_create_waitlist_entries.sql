CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  "bookingDate" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notified BOOLEAN DEFAULT FALSE
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
