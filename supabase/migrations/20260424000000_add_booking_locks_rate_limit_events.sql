create extension if not exists pgcrypto;

create table if not exists public.booking_locks (
  id uuid primary key default gen_random_uuid(),
  "lockKey" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now()
);

create unique index if not exists booking_locks_lock_key_key
  on public.booking_locks ("lockKey");

create index if not exists booking_locks_expires_at_idx
  on public.booking_locks ("expiresAt");

alter table public.booking_locks enable row level security;

revoke all on public.booking_locks from anon, authenticated;
grant select, insert, delete on public.booking_locks to service_role;

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  "identifierHash" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists rate_limit_events_bucket_identifier_expires_idx
  on public.rate_limit_events (bucket, "identifierHash", "expiresAt");

create index if not exists rate_limit_events_expires_at_idx
  on public.rate_limit_events ("expiresAt");

alter table public.rate_limit_events enable row level security;

revoke all on public.rate_limit_events from anon, authenticated;
grant select, insert, delete on public.rate_limit_events to service_role;

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identifier_hash text,
  p_max integer,
  p_window_ms integer
)
returns table(ok boolean, remaining integer, "retryAfterSeconds" integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_expires_at timestamptz := clock_timestamp() + make_interval(secs => p_window_ms::double precision / 1000.0);
  v_count integer;
  v_earliest_reset timestamptz;
begin
  if p_bucket is null or p_identifier_hash is null or p_max < 1 or p_window_ms < 1 then
    raise exception 'invalid rate limit input';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_identifier_hash, 0));

  delete from public.rate_limit_events
  where "expiresAt" <= v_now;

  select count(*), min("expiresAt")
    into v_count, v_earliest_reset
  from public.rate_limit_events
  where bucket = p_bucket
    and "identifierHash" = p_identifier_hash
    and "expiresAt" > v_now;

  if v_count >= p_max then
    return query select
      false,
      0,
      greatest(ceil(extract(epoch from (coalesce(v_earliest_reset, v_now) - v_now)))::integer, 1);
    return;
  end if;

  insert into public.rate_limit_events (bucket, "identifierHash", "expiresAt")
  values (p_bucket, p_identifier_hash, v_expires_at);

  return query select
    true,
    greatest(p_max - v_count - 1, 0),
    0;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
