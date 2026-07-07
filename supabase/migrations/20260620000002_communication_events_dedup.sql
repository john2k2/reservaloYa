-- Allow a distinct "skipped" status (channel not configured) instead of collapsing it into "failed",
-- and add a dedup constraint so concurrent cron invocations can't double-send the same event.
ALTER TABLE communication_events DROP CONSTRAINT IF EXISTS communication_events_status_check;
ALTER TABLE communication_events ADD CONSTRAINT communication_events_status_check
  CHECK (status IN ('sent', 'failed', 'skipped'));

CREATE UNIQUE INDEX IF NOT EXISTS communication_events_dedup_idx
  ON communication_events (booking_id, kind, channel);
