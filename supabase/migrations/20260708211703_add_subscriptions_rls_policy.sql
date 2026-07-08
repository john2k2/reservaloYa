-- `subscriptions` has RLS enabled but never had a policy, so `authenticated`
-- reads always returned zero rows regardless of GRANTs. resolveSubscriptionStatus
-- (src/server/supabase-store/helpers.ts) treats a missing row as
-- { subscriptionStatus: "trial", subscriptionExpired: false } -- so the
-- expired-subscription redirect in src/app/admin/(panel)/layout.tsx never
-- fired for ANY business, regardless of real trial/billing status.
--
-- Read-only: any team member (owner/admin/staff) of the business can see its
-- own subscription row. Mutations intentionally stay service-role-only (billing
-- writes go through MercadoPago webhooks / cron jobs, not the client).
CREATE POLICY "team_subscriptions_read" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND business_id = subscriptions."businessId"
    )
  );
