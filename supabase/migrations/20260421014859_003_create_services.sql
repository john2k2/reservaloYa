CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "durationMinutes" INTEGER NOT NULL CHECK ("durationMinutes" >= 1),
  price NUMERIC DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  "featuredLabel" TEXT,
  active BOOLEAN DEFAULT TRUE
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
