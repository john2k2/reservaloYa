CREATE POLICY "public_active_businesses_read" ON businesses
  FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "owner_admin_businesses_all" ON businesses
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = businesses.id)
  );
