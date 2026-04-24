CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  "blockedDate" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  reason TEXT
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
