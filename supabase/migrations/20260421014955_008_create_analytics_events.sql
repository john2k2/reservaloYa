CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  "eventName" TEXT NOT NULL,
  "pagePath" TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  referrer TEXT
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
