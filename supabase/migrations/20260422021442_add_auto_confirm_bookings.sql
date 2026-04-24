ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS "autoConfirmBookings" boolean NOT NULL DEFAULT false;
