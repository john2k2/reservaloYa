create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'admin', 'staff');
create type public.booking_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);
create type public.notification_channel as enum ('email', 'whatsapp');

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id
  from public.profiles
  where auth_user_id = auth.uid()
    and active is true
  limit 1;
$$;

revoke all on function public.current_business_id() from public;
grant execute on function public.current_business_id() to authenticated;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  address text,
  logo_url text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  role text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  blocked_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  staff_id uuid references public.staff(id) on delete set null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status public.booking_status not null default 'pending',
  notes text,
  reminder_24_sent boolean not null default false,
  reminder_2_sent boolean not null default false,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  channel public.notification_channel not null,
  template_key text not null,
  status text not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index businesses_slug_idx on public.businesses (slug);
create index profiles_business_id_idx on public.profiles (business_id);
create index services_business_id_idx on public.services (business_id);
create index staff_business_id_idx on public.staff (business_id);
create index customers_business_id_idx on public.customers (business_id);
create index availability_rules_business_id_idx on public.availability_rules (business_id);
create index blocked_slots_business_id_idx on public.blocked_slots (business_id);
create index bookings_business_id_idx on public.bookings (business_id);
create index bookings_schedule_idx on public.bookings (business_id, booking_date, start_time);
create index notification_logs_business_id_idx on public.notification_logs (business_id);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.notification_logs enable row level security;

create policy "businesses_select_own"
on public.businesses
for select
to authenticated
using (id = public.current_business_id());

create policy "businesses_select_public_active"
on public.businesses
for select
to anon
using (active is true);

create policy "businesses_update_own"
on public.businesses
for update
to authenticated
using (id = public.current_business_id())
with check (id = public.current_business_id());

create policy "profiles_select_own_business"
on public.profiles
for select
to authenticated
using (business_id = public.current_business_id());

create policy "profiles_update_own_business"
on public.profiles
for update
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "services_manage_own_business"
on public.services
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "services_select_public_active"
on public.services
for select
to anon
using (
  active is true
  and exists (
    select 1
    from public.businesses
    where businesses.id = services.business_id
      and businesses.active is true
  )
);

create policy "staff_manage_own_business"
on public.staff
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "customers_manage_own_business"
on public.customers
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "availability_manage_own_business"
on public.availability_rules
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "availability_select_public_active"
on public.availability_rules
for select
to anon
using (
  active is true
  and exists (
    select 1
    from public.businesses
    where businesses.id = availability_rules.business_id
      and businesses.active is true
  )
);

create policy "blocked_slots_manage_own_business"
on public.blocked_slots
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "blocked_slots_select_public"
on public.blocked_slots
for select
to anon
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = blocked_slots.business_id
      and businesses.active is true
  )
);

create policy "bookings_manage_own_business"
on public.bookings
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "bookings_select_public_active_slots"
on public.bookings
for select
to anon
using (
  status in ('pending', 'confirmed')
  and exists (
    select 1
    from public.businesses
    where businesses.id = bookings.business_id
      and businesses.active is true
  )
);

create policy "notification_logs_manage_own_business"
on public.notification_logs
for all
to authenticated
using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create or replace function public.create_public_booking(
  p_business_slug text,
  p_service_id uuid,
  p_booking_date date,
  p_start_time time,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
  v_service public.services;
  v_customer_id uuid;
  v_booking_id uuid;
  v_end_time time;
begin
  select *
  into v_business
  from public.businesses
  where slug = p_business_slug
    and active is true
  limit 1;

  if not found then
    raise exception 'Business not found';
  end if;

  select *
  into v_service
  from public.services
  where id = p_service_id
    and business_id = v_business.id
    and active is true
  limit 1;

  if not found then
    raise exception 'Service not found';
  end if;

  v_end_time := (p_start_time + make_interval(mins => v_service.duration_minutes))::time;

  if exists (
    select 1
    from public.blocked_slots
    where business_id = v_business.id
      and blocked_date = p_booking_date
      and p_start_time < end_time
      and start_time < v_end_time
  ) then
    raise exception 'Time slot blocked';
  end if;

  if exists (
    select 1
    from public.bookings
    where business_id = v_business.id
      and booking_date = p_booking_date
      and status in ('pending', 'confirmed')
      and p_start_time < end_time
      and start_time < v_end_time
  ) then
    raise exception 'Time slot unavailable';
  end if;

  select id
  into v_customer_id
  from public.customers
  where business_id = v_business.id
    and phone = p_phone
  order by created_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (
      business_id,
      full_name,
      phone,
      email,
      notes
    )
    values (
      v_business.id,
      p_full_name,
      p_phone,
      p_email,
      p_notes
    )
    returning id into v_customer_id;
  end if;

  insert into public.bookings (
    business_id,
    customer_id,
    service_id,
    booking_date,
    start_time,
    end_time,
    status,
    notes
  )
  values (
    v_business.id,
    v_customer_id,
    v_service.id,
    p_booking_date,
    p_start_time,
    v_end_time,
    'pending',
    p_notes
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.create_public_booking(
  text,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_public_booking(
  text,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text
) to anon, authenticated;

comment on function public.current_business_id() is
'Returns the current authenticated user business_id from profiles.';

comment on table public.bookings is
'Public booking writes should go through controlled server logic, not direct client writes.';
