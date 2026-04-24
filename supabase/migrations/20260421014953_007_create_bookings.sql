CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  "bookingDate" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  "paymentStatus" TEXT,
  "paymentAmount" NUMERIC,
  "paymentCurrency" TEXT,
  "paymentProvider" TEXT,
  "paymentPreferenceId" TEXT,
  "paymentExternalId" TEXT
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
