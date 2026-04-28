-- Crear tabla app_config para valores de configuración persistentes
-- Usada principalmente para guardar el último tipo de cambio dólar blue conocido

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default now() not null
);

-- Política RLS: solo service role puede leer/escribir
alter table public.app_config enable row level security;

create policy "Service role full access" on public.app_config
  for all
  to service_role
  using (true)
  with check (true);

-- Insertar valor inicial para last_blue_rate (se actualizará dinámicamente)
insert into public.app_config (key, value, updated_at)
values ('last_blue_rate', '1435', now())
on conflict (key) do nothing;