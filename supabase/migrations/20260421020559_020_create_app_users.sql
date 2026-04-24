CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'public_app')),
  active BOOLEAN DEFAULT TRUE,
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW()
);
