create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_name text not null check (
    event_name in ('public_page_view', 'booking_cta_clicked', 'booking_page_view', 'booking_created')
  ),
  page_path text not null,
  source text not null default 'direct',
  medium text not null default 'none',
  campaign text not null default '',
  referrer text not null default '',
  created_at timestamptz not null default now()
);

create index analytics_events_business_id_idx on public.analytics_events (business_id);
create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_event_name_idx on public.analytics_events (event_name);

alter table public.analytics_events enable row level security;

create policy "analytics_events_select_own_business"
on public.analytics_events
for select
to authenticated
using (business_id = public.current_business_id());

create policy "analytics_events_manage_own_business"
on public.analytics_events
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());
