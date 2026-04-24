CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "templateSlug" TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  active BOOLEAN DEFAULT TRUE,
  "publicProfileOverrides" TEXT DEFAULT '{}',
  "cancellationPolicy" TEXT,
  "mpAccessToken" TEXT,
  "mpRefreshToken" TEXT,
  "mpCollectorId" TEXT,
  "mpTokenExpiresAt" TIMESTAMPTZ,
  "mpConnected" BOOLEAN DEFAULT FALSE
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
