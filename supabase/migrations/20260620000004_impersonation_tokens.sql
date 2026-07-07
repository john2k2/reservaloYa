CREATE TABLE IF NOT EXISTS impersonation_tokens (
  token TEXT PRIMARY KEY,
  magic_link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Service-role only: no anon/authenticated policies. The real magic link must
-- never be reachable except through the server-side redirect route.
ALTER TABLE impersonation_tokens ENABLE ROW LEVEL SECURITY;
