CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
