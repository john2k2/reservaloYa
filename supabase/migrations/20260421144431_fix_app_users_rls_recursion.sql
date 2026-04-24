drop policy if exists owner_admin_manage_app_users on public.app_users;
drop policy if exists team_app_users_read on public.app_users;
drop policy if exists owner_admin_manage_app_users_insert on public.app_users;
drop policy if exists owner_admin_manage_app_users_update on public.app_users;
drop policy if exists owner_admin_manage_app_users_delete on public.app_users;

create or replace function public.current_user_has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users au
    where au.id = auth.uid()
      and au.business_id = target_business_id
      and au.role = any(allowed_roles)
      and au.active is distinct from false
  );
$$;

revoke all on function public.current_user_has_business_role(uuid, text[]) from public;
grant execute on function public.current_user_has_business_role(uuid, text[]) to authenticated;

create policy team_app_users_read on public.app_users
for select to authenticated
using (
  auth.uid() = id
  or public.current_user_has_business_role(app_users.business_id, array['owner', 'admin', 'staff'])
);

create policy owner_admin_manage_app_users_insert on public.app_users
for insert to authenticated
with check (
  public.current_user_has_business_role(app_users.business_id, array['owner', 'admin'])
);

create policy owner_admin_manage_app_users_update on public.app_users
for update to authenticated
using (
  public.current_user_has_business_role(app_users.business_id, array['owner', 'admin'])
)
with check (
  public.current_user_has_business_role(app_users.business_id, array['owner', 'admin'])
);

create policy owner_admin_manage_app_users_delete on public.app_users
for delete to authenticated
using (
  public.current_user_has_business_role(app_users.business_id, array['owner', 'admin'])
);
