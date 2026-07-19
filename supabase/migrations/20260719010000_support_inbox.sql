-- Inbox de consultas comerciales (platform) con hilos bidireccionales.
create extension if not exists pgcrypto;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text,
  source text not null default 'contacto'
    check (source in ('contacto', 'pricing', 'other')),
  subject text not null default 'Consulta comercial',
  status text not null default 'open'
    check (status in ('open', 'closed')),
  needs_reply boolean not null default true,
  last_message_at timestamptz not null default now(),
  access_token text not null unique,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create index if not exists support_threads_needs_reply_last_msg_idx
  on public.support_threads (needs_reply, last_message_at desc)
  where status = 'open';

create index if not exists support_threads_status_last_msg_idx
  on public.support_threads (status, last_message_at desc);

create index if not exists support_threads_visitor_email_idx
  on public.support_threads (visitor_email);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  author text not null
    check (author in ('visitor', 'staff', 'system', 'ai')),
  body text not null,
  staff_user_id uuid,
  created timestamptz not null default now()
);

create index if not exists support_messages_thread_created_idx
  on public.support_messages (thread_id, created asc);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

revoke all on public.support_threads from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;
grant select, insert, update on public.support_threads to service_role;
grant select, insert, update on public.support_messages to service_role;
