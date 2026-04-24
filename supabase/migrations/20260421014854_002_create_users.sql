CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  business_id UUID REFERENCES businesses(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'public_app')),
  active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
