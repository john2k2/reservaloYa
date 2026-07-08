-- Codifies the base table/sequence GRANTs that Supabase's hosted platform applies
-- automatically when a project is created from the dashboard. This repo's schema was
-- built entirely from CLI migrations, so those foundational grants were never captured
-- in version control -- they only exist as untracked state on the production database.
-- A fresh `supabase start` (or a prod rebuild from these migrations) ends up with
-- service_role/authenticated missing SELECT/INSERT/UPDATE/DELETE on almost every table,
-- which breaks signup, login, and any authenticated read.
--
-- service_role bypasses RLS (BYPASSRLS attribute) but still needs normal SQL grants --
-- it does NOT bypass GRANTs, despite the assumption in secure_businesses_columns.sql.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- authenticated: full access on every table except `businesses`, which stays governed
-- by the column-level SELECT allowlist from secure_businesses_columns.sql (excludes
-- mpAccessToken/mpRefreshToken/mpTokenExpiresAt). Grant table-wide DML on businesses
-- without touching SELECT so that allowlist is preserved.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

REVOKE SELECT ON businesses FROM authenticated;
GRANT SELECT (
  id,
  created,
  updated,
  name,
  slug,
  "templateSlug",
  phone,
  email,
  address,
  timezone,
  active,
  "publicProfileOverrides",
  "cancellationPolicy",
  "mpConnected",
  "mpCollectorId",
  "autoConfirmBookings"
) ON businesses TO authenticated;

-- Same allowlist logic for anon, matching secure_businesses_columns.sql's anon grant
-- (kept here too so this migration is a complete, self-contained source of truth for
-- base privileges -- re-running it is idempotent and doesn't rely on migration order).
REVOKE SELECT ON businesses FROM anon;
GRANT SELECT (
  id,
  created,
  updated,
  name,
  slug,
  "templateSlug",
  phone,
  email,
  address,
  timezone,
  active,
  "publicProfileOverrides",
  "cancellationPolicy",
  "mpConnected"
) ON businesses TO anon;

-- anon also needs base SELECT on the other tables its public-read RLS policies govern
-- (public_active_services_read_anon, public_active_availability_rules_read_anon,
-- public_business_blocked_slots_read_anon from public_read_policies_and_booking_conflicts_rpc.sql).
-- Table-wide is fine here -- unlike businesses, none of these carry secret columns.
GRANT SELECT ON services, availability_rules, blocked_slots TO anon;

-- NOTE: `reviews` is intentionally NOT granted to anon here. The public business page
-- queries reviews (see server logs: `SELECT "customerName", "rating", "comment", "created"
-- FROM reviews WHERE business_id = ... AND rating >= ...`) but no RLS policy grants anon
-- read access to reviews anywhere in this migration history -- only team_reviews_read
-- (authenticated, staff+). That looks like a separate, pre-existing gap: either the public
-- testimonials feature needs its own `TO anon` policy, or it was never meant to run
-- unauthenticated and the query should go through a public RPC instead. Flagging for a
-- follow-up decision rather than assuming a fix here.

-- Ensure future tables (created by later migrations) get these grants automatically,
-- so this class of bug can't recur. New sensitive tables should still add an explicit
-- REVOKE + column-level GRANT migration the same way businesses did.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role, authenticated;
