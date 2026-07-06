-- Row Level Security policies on `businesses` are row-scoped only; the default
-- table-wide SELECT grant to anon/authenticated still exposes every column
-- (including MercadoPago OAuth tokens) on any row a policy lets through.
-- This revokes the table-wide grant and re-grants SELECT on an explicit,
-- reviewed column list per role instead.

REVOKE SELECT ON businesses FROM anon, authenticated;

-- anon: only what the public business page / sitemap actually render.
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

-- authenticated: same as anon plus the columns the admin panel (own business,
-- scoped by the owner_admin_businesses_all row policy) legitimately reads.
-- "mpCollectorId" is a non-secret MercadoPago account id shown in settings.
-- "autoConfirmBookings" drives the admin booking-status toggle.
-- mpAccessToken / mpRefreshToken / mpTokenExpiresAt are intentionally excluded
-- from both roles: they are only ever read via the service-role client
-- (src/server/supabase-store/payments.ts, booking.ts) which bypasses grants.
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
