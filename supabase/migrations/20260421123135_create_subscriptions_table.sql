CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "businessId" UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'suspended')),
  "trialEndsAt" TIMESTAMPTZ,
  "nextBillingDate" TIMESTAMPTZ,
  "mpSubscriptionId" TEXT
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
