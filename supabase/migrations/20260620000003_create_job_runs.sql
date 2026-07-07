CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  summary JSONB,
  error TEXT
);

CREATE INDEX IF NOT EXISTS job_runs_job_name_started_at_idx ON job_runs (job_name, started_at DESC);

-- Server-only table: no anon/authenticated policies, only the service-role client
-- (which bypasses RLS) reads/writes this. A "running" row with an old started_at
-- and no finished_at signals a job that was killed mid-run.
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
