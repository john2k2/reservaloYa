insert into public.businesses (
  id,
  name,
  slug,
  phone,
  email,
  address,
  timezone
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Barberia',
  'demo-barberia',
  '+54 11 5555 0199',
  'hola@reservaya.app',
  'Av. del Libertador 214, Palermo',
  'America/Argentina/Buenos_Aires'
)
on conflict (id) do nothing;

insert into public.services (
  id,
  business_id,
  name,
  description,
  duration_minutes,
  price
)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Corte clasico',
    'Corte con terminacion prolija para uso diario.',
    45,
    12000
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Corte + barba',
    'Servicio completo con perfilado y terminacion.',
    60,
    18000
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Perfilado premium',
    'Repaso rapido para mantener prolijo el look.',
    30,
    8000
  )
on conflict (id) do nothing;

insert into public.staff (
  id,
  business_id,
  full_name,
  role
)
values (
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'Matias Gomez',
  'barbero principal'
)
on conflict (id) do nothing;

insert into public.customers (
  id,
  business_id,
  full_name,
  phone,
  email,
  notes
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    'Luca Sosa',
    '+54 11 4444 1000',
    'luca@example.com',
    'Prefiere turno temprano.'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    'Mara Diaz',
    '+54 11 4444 2000',
    'mara@example.com',
    'Cliente recurrente.'
  )
on conflict (id) do nothing;

insert into public.availability_rules (
  id,
  business_id,
  staff_id,
  day_of_week,
  start_time,
  end_time
)
values
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    1,
    '09:00',
    '18:00'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    3,
    '09:00',
    '18:00'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    5,
    '10:00',
    '20:00'
  )
on conflict (id) do nothing;

insert into public.blocked_slots (
  id,
  business_id,
  staff_id,
  blocked_date,
  start_time,
  end_time,
  reason
)
values (
  '66666666-6666-6666-6666-666666666661',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333331',
  '2026-03-13',
  '13:00',
  '14:00',
  'Almuerzo'
)
on conflict (id) do nothing;

insert into public.bookings (
  id,
  business_id,
  customer_id,
  service_id,
  staff_id,
  booking_date,
  start_time,
  end_time,
  status,
  notes
)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    '2026-03-13',
    '10:00',
    '11:00',
    'confirmed',
    'Reserva generada para demo comercial.'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-3333-3333-333333333331',
    '2026-03-13',
    '16:45',
    '17:15',
    'pending',
    'Esperando confirmacion.'
  )
on conflict (id) do nothing;

insert into public.notification_logs (
  id,
  business_id,
  booking_id,
  channel,
  template_key,
  status,
  sent_at
)
values (
  '88888888-8888-8888-8888-888888888881',
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777771',
  'email',
  'booking-confirmation',
  'sent',
  now()
)
on conflict (id) do nothing;

-- Profiles are not seeded here because they depend on real auth.users ids.
