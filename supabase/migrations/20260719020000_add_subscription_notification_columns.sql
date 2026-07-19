-- Dedup markers for subscription lifecycle emails (trial-ending + dunning).
-- Set when the corresponding email is sent so the daily billing sweep never
-- re-sends. `dunningNotifiedAt` is reset to NULL on renewal so a future overdue
-- cycle notifies again. `trialEndingNotifiedAt` is terminal for the trial.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS "trialEndingNotifiedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "dunningNotifiedAt" TIMESTAMPTZ;
