-- `active` solo distingue negocios pausados/deshabilitados por el dueño o platform-admin.
-- No hay ninguna columna que distinga "recién creado en el paso 1 del onboarding" de
-- "el dueño terminó de cargar marca, fotos y datos públicos". Por eso negocios de prueba
-- o abandonados a mitad del wizard (ej. slugs "asdasd", "polar-test-membresia-2607")
-- quedaban públicos e indexables desde el momento de creación.
--
-- `published` se marca true recién cuando el dueño completa el último paso del wizard
-- de onboarding (ver saveOnboardingBranding en src/app/admin/(panel)/onboarding/actions.ts).
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: preservar la visibilidad actual de negocios ya activos, para no sacar de
-- golpe de la búsqueda a negocios reales que ya estaban en producción.
UPDATE businesses SET published = TRUE WHERE active = TRUE;

-- Tenants de prueba detectados ya indexados por Google Search Console antes de este fix
-- (ver docs/ops — hallazgo del audit de SEO de reservaya.ar). Se despublican explícitamente
-- en vez de confiar en el backfill genérico de arriba.
UPDATE businesses SET published = FALSE WHERE slug IN ('asdasd', 'polar-test-membresia-2607');
