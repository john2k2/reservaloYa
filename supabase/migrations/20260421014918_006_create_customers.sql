CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
