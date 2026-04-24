CREATE TABLE IF NOT EXISTS rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  bucket TEXT NOT NULL,
  "identifierHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL
);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
