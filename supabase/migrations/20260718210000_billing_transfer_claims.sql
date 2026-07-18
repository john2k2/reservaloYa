-- Comprobantes de transferencia para activar suscripciones SaaS.
create extension if not exists pgcrypto;

create table if not exists public.billing_transfer_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  amount_ars numeric(12, 2),
  currency text not null default 'ARS',
  receipt_path text not null,
  receipt_mime text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index if not exists billing_transfer_claims_status_created_idx
  on public.billing_transfer_claims (status, created desc);

create index if not exists billing_transfer_claims_business_created_idx
  on public.billing_transfer_claims (business_id, created desc);

alter table public.billing_transfer_claims enable row level security;

revoke all on public.billing_transfer_claims from anon, authenticated;
grant select, insert, update on public.billing_transfer_claims to service_role;

-- Bucket privado para comprobantes (solo service role via API admin).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'billing-receipts',
  'billing-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
