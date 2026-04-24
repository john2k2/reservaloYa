CREATE POLICY "admin_analytics_write" ON analytics_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = analytics_events.business_id));

CREATE POLICY "admin_waitlist_write" ON waitlist_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = waitlist_entries.business_id));

CREATE POLICY "team_waitlist_read" ON waitlist_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = waitlist_entries.business_id));

CREATE POLICY "admin_waitlist_update" ON waitlist_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = waitlist_entries.business_id));

CREATE POLICY "admin_waitlist_delete" ON waitlist_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = waitlist_entries.business_id));

CREATE POLICY "team_reviews_read" ON reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = reviews.business_id));

CREATE POLICY "team_reviews_write" ON reviews FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = reviews.business_id));

CREATE POLICY "owner_admin_reviews_update" ON reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = reviews.business_id));

CREATE POLICY "owner_admin_reviews_delete" ON reviews FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = reviews.business_id));

CREATE POLICY "admin_comm_write" ON communication_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = communication_events.business_id));

CREATE POLICY "team_comm_read" ON communication_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'staff') AND business_id = communication_events.business_id));

CREATE POLICY "admin_comm_update" ON communication_events FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role IN ('owner', 'admin') AND business_id = communication_events.business_id));
