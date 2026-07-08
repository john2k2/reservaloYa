# ReservaYa — Arquitectura técnica

## Visión general

ReservaYa es una aplicación de turnos online multi-tenant para negocios chicos (peluquerías,
barberías, spas). El objetivo actual no es resolver la arquitectura final para escalar a gran
volumen, sino tener:

- una demo comercial creíble
- una app funcional para operar un negocio real
- una base técnica simple de mantener

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS v4, shadcn/ui |
| Backend / Auth / DB | Supabase (único backend) |
| Email | Resend (API REST directa, sin SDK) |
| WhatsApp | Meta WhatsApp Cloud API (preferido) con fallback a Twilio (API REST directa, sin SDK) |
| Pagos | MercadoPago OAuth por negocio + cuenta plataforma (API REST directa, sin SDK) |
| Archivos | Vercel Blob |
| Monitoreo | Sentry |
| Testing | Vitest + Testing Library (unit), Playwright (e2e) |

Decisión explícita: Resend, Twilio y MercadoPago se integran vía `fetch` nativo contra sus REST
APIs, no con SDKs oficiales — no aparecen como dependencias en `package.json`. Motivo documentado
en el código: evitar cargar el SDK completo para unas pocas llamadas.

---

## Modelo multi-tenant y seguridad de datos

Cada negocio (`business_id`) vive en la misma app y la misma instancia de Postgres. El
aislamiento entre negocios se garantiza en **dos capas distintas**, según qué cliente Supabase se
use:

| Cliente | Dónde se usa | Cómo se garantiza el scoping |
|---|---|---|
| `createPublicClient()` (anon key) | Lecturas públicas (`(public)/[slug]`) | RLS en Postgres |
| `createSessionClient(token)` (anon key + JWT del usuario) | Panel admin, lecturas autenticadas | RLS en Postgres, con `auth.uid()` |
| `createAdminClient()` (service role) | Mutaciones admin, jobs, server actions | **Bypassa RLS** — el filtro `business_id` se aplica a mano en cada query de `src/server/supabase-store/*.ts` |

Hay ~40 migraciones de RLS en `supabase/migrations/` (ej. `023_rls_services_avail_blocked.sql`,
`024_rls_customers_bookings.sql`) con políticas del tipo:

```sql
EXISTS (
  SELECT 1 FROM app_users
  WHERE id = auth.uid() AND role IN (...) AND business_id = <tabla>.business_id
)
```

Cuando el código pasa por `createAdminClient()` (service role), esa protección de Postgres no
aplica — el aislamiento depende de que la función en TypeScript reciba y aplique correctamente el
`businessId` de la sesión. Es una responsabilidad doble a tener en cuenta al tocar código admin:
**RLS protege las rutas públicas y autenticadas por JWT; el filtrado manual protege las rutas con
service role.**

Defensas adicionales a nivel DB (no solo aplicación):
- `prevent_overlapping_bookings.sql` — constraint/trigger que evita turnos solapados.
- `communication_events_dedup.sql` — deduplicación de notificaciones enviadas.
- `secure_businesses_columns.sql` — endurece columnas sensibles (tokens de MercadoPago).
- RPC `get_public_booking_conflicts` — calcula slots disponibles sin exponer filas completas de `bookings` al anon key.

---

## Estructura del proyecto

```txt
src/
  app/
    (public)/[slug]/       # sitio público del negocio
      page.tsx
      reservar/
      confirmacion/
      mi-turno/
      resena/
    admin/(panel)/         # panel del negocio (dueño/staff)
      dashboard/ bookings/ services/ availability/
      customers/ team/ billing/ settings/ onboarding/
    platform/(panel)/      # panel de super-admin de la plataforma
      dashboard/ businesses/ users/
    api/
      auth/mercadopago/{start,callback}/
      auth/session/
      analytics/
      jobs/{booking-reminders,subscription-billing}/
      payments/{create-preference,webhook}/
      platform/impersonate/[token]/
      public/booking-slots/
      monitoring/errors/

  server/
    actions/              # server actions "use server"
    supabase-store/       # capa de acceso a datos (una función por caso de uso)
    supabase-auth.ts
    supabase-domain.ts    # tipos de dominio + lógica pura (slots, money, status)
    mercadopago*.ts
    booking-notifications.ts
    public-booking-links.ts

  lib/supabase/           # clientes Supabase (browser/admin/public/session)
  constants/public-business-profiles.ts   # templates + overrides de perfil público
  components/
```

`/admin/settings` existe hoy como compatibilidad; el editor real del perfil público está
centralizado en `/admin/onboarding`.

---

## Modelo de datos (`src/server/supabase-domain.ts`)

Todo cuelga de `BusinessRecord` vía `business_id`.

| Tipo | Campos clave |
|---|---|
| `BusinessRecord` | `slug`, `templateSlug?`, `publicProfileOverrides?` (JSON string), `mpAccessToken/mpRefreshToken/mpCollectorId/mpTokenExpiresAt/mpConnected`, `autoConfirmBookings?`, `cancellationPolicy?` |
| `ServiceRecord` | `business_id`, `durationMinutes`, `price?`, `featured?`, `active?` |
| `CustomerRecord` | `business_id`, `fullName`, `phone?`, `email?` |
| `BookingRecord` | `business_id`, `customer_id`, `service_id`, `bookingDate`, `startTime/endTime`, `status: BookingStatus`, `paymentStatus?/paymentAmount?/paymentProvider?/paymentPreferenceId?/paymentExternalId?` |
| `AvailabilityRuleRecord` | `business_id`, `dayOfWeek`, `startTime/endTime`, `active?` |
| `BlockedSlotRecord` | `business_id`, `blockedDate`, `startTime/endTime`, `reason?` |
| `WaitlistEntryRecord` | `business_id`, `service_id?`, `bookingDate`, `fullName/email/phone?`, `notified?` |
| `ReviewRecord` | `business_id`, `booking_id?`, `service_id?`, `rating`, `comment?` |
| `CommunicationRecord` | `business_id`, `booking_id`, `channel`, `kind` (`confirmation\|reminder\|followup`), `status` (`sent\|failed`) |
| `SubscriptionRecord` | `businessId`, `status` (`trial\|active\|cancelled\|suspended`), `trialEndsAt?`, `mpSubscriptionId?` |
| `AnalyticsRecord` | `business_id`, `eventName`, `pagePath`, `source/medium/campaign?` |
| `AppUserRecord` | `business_id?`, `role?`, `active?` |

`BookingStatus = pending | pending_payment | confirmed | completed | cancelled | no_show`.

Lógica de dominio pura vive en el mismo archivo: `calculateSlots` (itera reglas de disponibilidad
en pasos de 15 min, descarta conflictos con `blocked_slots` y `bookings`), `overlaps`,
`buildBusinessPublicProfile` (combina template + overrides), `toMoney`, `formatStatus`.

---

## Capa de acceso a datos (`src/server/supabase-store/`)

Un archivo por dominio, cada uno con su `*.test.ts` colocated:

| Archivo | Responsabilidad |
|---|---|
| `_core.ts` | Cliente admin genérico + CRUD tipo REST sobre `client.from(table)` |
| `business.ts` | Lectura de página pública, cálculo de flujo de booking, settings de pago |
| `booking.ts` | Creación, cancelación, reprogramación, actualización de pago de reservas |
| `admin.ts` | Queries/mutaciones del panel admin (servicios, disponibilidad, dashboard) |
| `waitlist.ts` | Lista de espera |
| `review.ts` | Reseñas |
| `analytics.ts` | Eventos de analítica |
| `subscription.ts` | Suscripción/billing de la plataforma |
| `payments.ts` | Utilidades de pago a nivel store |
| `reminders.ts` | Recordatorios y follow-ups automáticos (jobs) |
| `job-runs.ts` | Registro de ejecuciones de cron jobs |

---

## Server Actions (`src/server/actions/`)

- **`public-booking.ts`**: flujo completo de reserva pública. Rate limiting doble (por
  IP+slug+fecha+hora, 8/60s; por email hasheado con SHA-256, 5/10min contra email-bombing).
  Setea `status: "pending_payment"` si el negocio requiere pago, si no `"confirmed"`.
- **`waitlist.ts`**: `joinWaitlistAction`, validación Zod + rate limit.
- **`review.ts`**: `submitReviewAction`, exige token HMAC scope `review`.
- **`platform.ts`**: acciones de super-admin (`toggleBusinessActiveAction`,
  `enableTrialAction`, `impersonateBusinessOwnerAction`, etc.), gateadas por
  `getAuthenticatedPlatformAdmin()`, cada una escribe un `AuditAction` best-effort.

Además hay acciones colocated junto a cada página del panel admin
(`src/app/admin/(panel)/{availability,billing,bookings,onboarding,services,team,dashboard}/actions.ts`).

---

## Links firmados (HMAC) — `src/server/public-booking-links.ts`

Protege operaciones sensibles sobre una reserva (ver, cancelar, reprogramar, confirmar, reseñar)
sin requerir login del cliente final.

- **Formato**: `base64url(payload).base64url(hmac_sha256(payload))`, con `timingSafeEqual` para
  comparación constant-time.
- **Payload**: `{ slug, bookingId, exp, scope }`, con `scope: "manage" | "confirmation" | "review"`.
  Un token de un scope no sirve para otro (`hasValidBookingAccessToken` valida `scope ∈ allowedScopes`).
- **Secreto**: `BOOKING_LINK_SECRET`. Sin esta env var, en producción no se pueden generar links
  (falla explícito); en desarrollo solo funciona si además `ALLOW_DEV_SECRETS=1`.
- **TTL**: `BOOKING_LINK_TTL_DAYS`, default 30 días.

---

## Theming del sitio público

- `src/constants/public-business-profiles.ts` define `templatePresets` (paletas y copys
  predefinidos por template, ej. `demo-barberia`) y `getPublicBusinessProfile(slug, name,
  templateSlug?)`, que cae a un perfil genérico si no hay preset.
- `mergePublicBusinessProfile(base, overrides)` combina el preset con
  `BusinessRecord.publicProfileOverrides` (JSON editable desde `/admin/onboarding`), permitiendo
  personalización por negocio sin perder el template base.
- `PublicBusinessPageWrapper` (client) recibe el `profile` completo y alimenta
  `PublicBusinessThemeProvider` solo con `enableDarkMode`/`darkModeColors`.
- `PublicBusinessThemeProvider` gestiona un modo oscuro **independiente** del tema del panel
  admin: usa una key de `localStorage` separada (`public-theme` vs. `theme`) y restaura la clase
  `dark` del admin al desmontar, para no filtrar el dark mode público al resto del sitio. Si hay
  `darkModeColors`, setea custom properties CSS (`--accent`, `--surface-tint`, etc.) en modo oscuro.

El resto de los componentes de la página pública consumen el `profile` vía props directamente, no
vía contexto React.

---

## Notificaciones (`src/server/booking-notifications.ts`)

- **Email**: `sendResendEmail()` hace POST directo a `api.resend.com` (fetch, timeout 10s).
  `RESEND_FROM_EMAIL` si está seteado, si no cae a `onboarding@resend.dev`. HTML inline generado
  por helpers propios (`./email-templates`), sin plantillas de Resend.
- **WhatsApp**: se intenta primero Meta WhatsApp Cloud API (`isMetaWhatsAppConfigured()`); solo si
  esa vía retorna `"skipped"` cae a Twilio. `isTwilioConfigured()` exige las 3 env vars
  (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`). Envío vía REST directa con
  Basic Auth, soporta plantillas de contenido Twilio o texto libre.
- `getAvailableReminderChannels()` / `hasReminderProviderConfigured()` gatean qué canales están
  disponibles según los datos del cliente (email/teléfono) y los providers configurados.

---

## Pagos — MercadoPago OAuth por negocio

Cada negocio conecta su propia cuenta de MercadoPago (no hay una cuenta única de plataforma para
cobrar turnos).

**Flujo OAuth**:
1. `GET /api/auth/mercadopago/start`: genera `nonce`, firma un `state` HMAC
   (`createMercadoPagoOAuthState`, secreto `MP_APP_SECRET`, expira en 10 min), guarda el nonce en
   cookie httpOnly, redirige a `auth.mercadopago.com/authorization`.
2. `GET /api/auth/mercadopago/callback`: valida `code` + `state` (firma HMAC, nonce de cookie,
   `businessSlug`/`userEmail`/`businessId` coinciden con la sesión admin actual — anti
   CSRF/session-fixation). Intercambia `code` por tokens.
3. Guarda tokens vía `updateSupabaseBusinessMPTokens`.

**Almacenamiento de tokens**: encriptados en reposo con AES-256-GCM
(`src/server/mp-token-crypto.ts`), formato `enc1:<iv>:<auth_tag>:<ciphertext>`. En producción la
clave `MP_TOKEN_ENCRYPTION_KEY` es obligatoria (falla si falta o tiene longitud incorrecta); en
dev sin clave, guarda en plaintext con warning (compat con datos legacy). Refresh automático
cuando el access token expira en <60s (`getUsableBusinessMercadoPagoAccessToken`).

**`pending_payment`**: se setea en `public-booking.ts` cuando el negocio tiene pago habilitado
(`requiresPayment`). El webhook (`/api/payments/webhook`) solo procesa bookings en
`["pending_payment", "confirmed"]` y usa `expectedCurrentStatus` en el update para lograr
idempotencia ante notificaciones duplicadas de MercadoPago.

---

## Testing

- **Vitest** (`vitest.config.ts`): `environment: jsdom`, `fileParallelism: false` (tests
  secuenciales por estado/mocks de Supabase compartidos), tests colocated (`*.test.ts` junto al
  código), alias `@` → `./src`.
- **Coverage** (v8): thresholds `statements 58 / branches 40 / functions 55 / lines 60` — reflejan
  cobertura real medida, no un objetivo aspiracional.
- **Playwright**: proyectos `public-smoke`, `admin-authenticated`, `manual-chromium`.
- `npm run check` = `lint && typecheck && test -- --run && build` — gate completo antes de pushear.

---

## Reglas técnicas

- TypeScript estricto, validación con Zod en los límites (server actions).
- Lógica sensible siempre en servidor — no confiar en disponibilidad calculada solo en frontend.
- Evitar duplicación de pantallas y flujos.
- Priorizar simplicidad sobre sobre-ingeniería: Supabase + Vercel, sin reintroducir un segundo
  backend salvo necesidad concreta.

## Estado funcional

**Operativo**: login admin, dashboard, clientes, CRUD de servicios/disponibilidad/bloqueos,
reserva pública, confirmación, gestión de turno por link, reseñas, MercadoPago OAuth por negocio,
suscripción de plataforma con historial de intentos, rate-limit y locks de slots persistidos.

**Incompleto**: observabilidad/analytics avanzados post-lanzamiento, selección pública de
profesional/staff.
