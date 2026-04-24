CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created     timestamptz NOT NULL DEFAULT now(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  text NOT NULL DEFAULT '',
  action      text NOT NULL,        -- e.g. 'booking.updated', 'service.created'
  entity_id   text NOT NULL DEFAULT '',
  metadata    jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS audit_logs_business_id_idx ON public.audit_logs (business_id, created DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (business_id, action, entity_id);

-- Solo el service role puede insertar/leer; los usuarios no tienen acceso directo
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_no_direct_access"
  ON public.audit_logs
  FOR ALL
  USING (false);
