-- Polar IDs for platform subscription billing (transferencia + Polar checkout).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS "polarSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "polarCustomerId" TEXT;

CREATE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_idx
  ON public.subscriptions ("polarSubscriptionId")
  WHERE "polarSubscriptionId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_polar_customer_id_idx
  ON public.subscriptions ("polarCustomerId")
  WHERE "polarCustomerId" IS NOT NULL;
