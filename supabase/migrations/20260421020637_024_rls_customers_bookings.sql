CREATE POLICY "team_customers_read" ON customers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = customers.business_id));

CREATE POLICY "team_customers_write" ON customers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = customers.business_id));

CREATE POLICY "owner_admin_customers_update" ON customers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = customers.business_id));

CREATE POLICY "owner_admin_customers_delete" ON customers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = customers.business_id));

CREATE POLICY "team_bookings_read" ON bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = bookings.business_id));

CREATE POLICY "team_bookings_update" ON bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = bookings.business_id));

CREATE POLICY "owner_admin_bookings_insert" ON bookings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = bookings.business_id));

CREATE POLICY "owner_admin_bookings_delete" ON bookings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = bookings.business_id));
