CREATE POLICY "team_services_read" ON services FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = services.business_id));

CREATE POLICY "team_services_write" ON services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = services.business_id));

CREATE POLICY "team_services_update" ON services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = services.business_id));

CREATE POLICY "owner_admin_services_delete" ON services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = services.business_id));

CREATE POLICY "team_availability_rules_read" ON availability_rules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = availability_rules.business_id));

CREATE POLICY "team_availability_rules_write" ON availability_rules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = availability_rules.business_id));

CREATE POLICY "owner_admin_availability_rules_update" ON availability_rules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = availability_rules.business_id));

CREATE POLICY "owner_admin_availability_rules_delete" ON availability_rules FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = availability_rules.business_id));

CREATE POLICY "team_blocked_slots_read" ON blocked_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = blocked_slots.business_id));

CREATE POLICY "team_blocked_slots_write" ON blocked_slots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = blocked_slots.business_id));

CREATE POLICY "owner_admin_blocked_slots_update" ON blocked_slots FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = blocked_slots.business_id));

CREATE POLICY "owner_admin_blocked_slots_delete" ON blocked_slots FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = blocked_slots.business_id));
