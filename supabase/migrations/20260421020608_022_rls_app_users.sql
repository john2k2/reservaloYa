CREATE POLICY "app_users_own_read" ON app_users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "owner_admin_manage_app_users" ON app_users
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app_users au WHERE au.id = auth.uid() AND au.role IN ('owner', 'admin') AND au.business_id = app_users.business_id)
  );
