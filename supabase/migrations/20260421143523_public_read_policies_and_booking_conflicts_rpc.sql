drop policy if exists public_active_businesses_read_anon on public.businesses;
create policy public_active_businesses_read_anon on public.businesses
for select to anon
using (active = true);

drop policy if exists public_active_services_read_anon on public.services;
create policy public_active_services_read_anon on public.services
for select to anon
using (
  active = true
  and exists (
    select 1
    from public.businesses b
    where b.id = services.business_id
      and b.active = true
  )
);

drop policy if exists public_active_availability_rules_read_anon on public.availability_rules;
create policy public_active_availability_rules_read_anon on public.availability_rules
for select to anon
using (
  active = true
  and exists (
    select 1
    from public.businesses b
    where b.id = availability_rules.business_id
      and b.active = true
  )
);

drop policy if exists public_business_blocked_slots_read_anon on public.blocked_slots;
create policy public_business_blocked_slots_read_anon on public.blocked_slots
for select to anon
using (
  exists (
    select 1
    from public.businesses b
    where b.id = blocked_slots.business_id
      and b.active = true
  )
);

create or replace function public.get_public_booking_conflicts(input_business_id uuid, input_booking_date text)
returns table (
  id uuid,
  "startTime" text,
  "endTime" text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select b.id, b."startTime", b."endTime", b.status
  from public.bookings b
  where b.business_id = input_business_id
    and b."bookingDate" = input_booking_date
    and b.status in ('pending', 'pending_payment', 'confirmed', 'completed');
$$;

revoke all on function public.get_public_booking_conflicts(uuid, text) from public;
grant execute on function public.get_public_booking_conflicts(uuid, text) to anon, authenticated;
