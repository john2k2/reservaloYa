-- La política RLS `team_bookings_update` (20260421020637_024_rls_customers_bookings.sql)
-- limita qué FILAS puede tocar un miembro del equipo, pero no qué COLUMNAS: combinada con
-- el `GRANT ALL ON ALL TABLES ... TO authenticated` de
-- 20260708191920_grant_base_table_privileges.sql, cualquier usuario autenticado con rol
-- staff/owner/admin podía hacer UPDATE vía PostgREST de los campos de pago
-- ("paymentStatus", "paymentAmount", "paymentCurrency", "paymentProvider",
-- "paymentPreferenceId", "paymentExternalId"), que el flujo de negocio reserva al webhook
-- de MercadoPago y a las server actions (cliente service-role).
--
-- Al igual que en 20260620000000_secure_businesses_columns.sql, las políticas RLS no
-- alcanzan: hay que restringir los privilegios de columna. Como el rol `authenticated`
-- tiene UPDATE a nivel tabla, un REVOKE por columna no tendría efecto (los grants de
-- tabla cubren todas las columnas); la vía correcta es revocar el UPDATE table-wide y
-- volver a otorgarlo sólo sobre la lista de columnas que el equipo puede editar.
--
-- Verificado en el código: ninguna escritura sobre `bookings` usa el cliente de sesión
-- (createServerClient). Todas las mutaciones pasan por el cliente service-role
-- (src/server/supabase-store/_core.ts -> createAdminClient), que bypasea GRANTs, así que
-- la app no se ve afectada. El panel admin sólo lee bookings vía sesión
-- (src/server/supabase-store/admin.ts).

REVOKE UPDATE ON bookings FROM authenticated;

-- Columnas editables por el equipo (owner/admin/staff según las políticas RLS):
-- datos operativos del turno. `updated` se mantiene por convención del proyecto.
-- Excluidas a propósito:
--   id, created, business_id, customer_id, service_id  -> identidad/referencias, inmutables
--   "paymentStatus", "paymentAmount", "paymentCurrency", "paymentProvider",
--   "paymentPreferenceId", "paymentExternalId"         -> sólo service-role (webhook MP)
--   "bookingRange"                                     -> columna generada, no actualizable
GRANT UPDATE (
  "bookingDate",
  "startTime",
  "endTime",
  status,
  notes,
  updated
) ON bookings TO authenticated;

-- NOTA sobre `team_customers_write` (INSERT para staff): la tabla `customers` sólo tiene
-- fullName/phone/email/notes más las referencias, sin campos sensibles de pago ni tokens,
-- así que no se aplica una restricción análoga.
