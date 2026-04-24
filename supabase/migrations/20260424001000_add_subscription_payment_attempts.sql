create extension if not exists pgcrypto;

create table if not exists public.subscription_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  "businessId" text not null,
  "preferenceId" text not null,
  "amountArs" numeric(12, 2) not null,
  currency text not null default 'ARS',
  "blueRate" numeric(12, 4),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  "paymentId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists subscription_payment_attempts_preference_id_key
  on public.subscription_payment_attempts ("preferenceId");

create index if not exists subscription_payment_attempts_business_status_created_idx
  on public.subscription_payment_attempts ("businessId", status, "createdAt" desc);

create index if not exists subscription_payment_attempts_payment_id_idx
  on public.subscription_payment_attempts ("paymentId");

alter table public.subscription_payment_attempts enable row level security;

revoke all on public.subscription_payment_attempts from anon, authenticated;
grant select, insert, update on public.subscription_payment_attempts to service_role;
