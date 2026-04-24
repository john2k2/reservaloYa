# Go Live Checklist

**URL actual:** https://reservaya.ar

---

## Estado actual (2026-04-24)

| Item | Estado |
|------|--------|
| App desplegada en Vercel | ✅ |
| Build productivo pasando | ✅ |
| Tests pasando | ✅ |
| Emails HTML inline (sin dominio requerido) | ✅ |
| CRUD admin completo | ✅ |
| Flujo público de reserva completo | ✅ |
| Pago online via MercadoPago | ✅ |
| Suscripcion plataforma via MercadoPago | ✅ |
| Follow-up post-turno con link a reseña | ✅ |
| Lista de espera (waitlist) | ✅ |
| Reseñas post-turno | ✅ |
| Páginas legales /privacidad y /terminos | ✅ |
| Endpoint cron `/api/jobs/booking-reminders` | ✅ |
| `vercel.json` con cron `0 13 * * *` (1pm UTC) | ✅ |
| Variables de entorno en Vercel | ⏳ ver abajo |
| Supabase en producción | ✅ |
| Cron activo y probado | ⏳ pendiente |
| Dominio propio en Resend | ⏳ pendiente |
| Sentry configurado en producción | ⏳ pendiente |

---

## Paso 1 — Variables de entorno en Vercel

Ir a: **Vercel Dashboard → reservaya-kappa → Settings → Environment Variables**

### Mínimas para que funcione la demo pública

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://reservaya-kappa.vercel.app` | URL pública de la app |
| `BOOKING_LINK_SECRET` | (generar 32+ chars aleatorios) | Tokens de gestión y reseña |
| `CRON_SECRET` | (generar 32+ chars aleatorios) | Vercel lo envía automáticamente al cron |

> Generar secrets: `openssl rand -hex 32` o https://1password.com/password-generator/

### Para Sentry (observabilidad productiva)

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | DSN público del proyecto | Requerido para errores cliente, tracing y replay |
| `SENTRY_DSN` | DSN del mismo proyecto | Recomendado para runtime server/edge |
| `SENTRY_ORG` | slug de la org | Necesario para source maps en build |
| `SENTRY_PROJECT` | slug del proyecto | Necesario para source maps en build |
| `SENTRY_AUTH_TOKEN` | token `project:releases` + `org:read` | Guardarlo solo en Vercel / CI |
| `SENTRY_ENVIRONMENT` | `production` | Usar `preview` o `staging` si corresponde |
| `SENTRY_RELEASE` | commit SHA o versión | Ideal: `VERCEL_GIT_COMMIT_SHA` |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Ajustar si el volumen crece |
| `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | `0.1` | Safe default para sesiones normales |
| `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | `1.0` | Mantener en `1.0` para sesiones con error |

> Crear el proyecto en Sentry antes del redeploy y copiar el mismo DSN en `NEXT_PUBLIC_SENTRY_DSN` y `SENTRY_DSN`.
> El token de auth no se commitea: cargarlo en Vercel o en un `.env.sentry-build-plugin` local ignorado por git.

### Para emails (Resend)

| Variable | Valor | Notas |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_xxxxx` | API Key de https://resend.com |
| `RESEND_FROM_EMAIL` | (vacío) | Sin dominio propio, dejar vacío → usa onboarding@resend.dev |

> Con `RESEND_FROM_EMAIL` vacío solo podés enviar a tu propio email verificado en Resend.
> Para producción real con clientes, necesitás dominio propio.

### Para WhatsApp reminders (opcional)

| Variable | Valor | Notas |
|----------|-------|-------|
| `TWILIO_ACCOUNT_SID` | `ACxxxxx` | Desde Twilio Console |
| `TWILIO_AUTH_TOKEN` | (auth token) | Desde Twilio Console |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Número Sandbox o aprobado |

> Sin estas variables, solo se envían reminders por email. No bloquea ningún flujo.

### Para MercadoPago (pagos online y suscripciones)

| Variable | Valor | Notas |
|----------|-------|-------|
| `MP_APP_ID` | ID de la app MP | Desde Mercado Pago Developers |
| `MP_APP_SECRET` | Secret de la app | Para OAuth por negocio |
| `MP_ACCESS_TOKEN` | Access token de plataforma | Para cobrar suscripciones de negocios |
| `MP_WEBHOOK_SECRET` | Secret del webhook | Validación de firma para `/api/payments/webhook`; requerido en producción |

### Para Supabase

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Cliente y server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | Cliente y lecturas publicas |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Solo server-side |

---

## Paso 2 — Redeploy

Después de agregar variables: **Deployments → deploy reciente → ··· → Redeploy**

Antes del redeploy productivo:

1. Crear org/proyecto en Sentry y copiar DSN / slugs.
2. Cargar `SENTRY_AUTH_TOKEN` en Vercel.
3. Confirmar que el build use `SENTRY_RELEASE` (recomendado: `VERCEL_GIT_COMMIT_SHA`).
4. Redeploy para que se suban source maps.

---

## Paso 3 — Verificar el cron

El cron ya está configurado en `vercel.json`:
```json
{
  "crons": [{ "path": "/api/jobs/booking-reminders", "schedule": "0 13 * * *" }]
}
```

Vercel envía automáticamente `Authorization: Bearer {CRON_SECRET}` al endpoint.

**Verificar manualmente después del redeploy:**
```bash
curl "https://reservaya-kappa.vercel.app/api/jobs/booking-reminders?dryRun=true" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Respuesta esperada:
```json
{ "ok": true, "result": { "processed": 0, "sent": 0, "errors": 0 } }
```

> Nota: en plan Hobby de Vercel el cron solo puede correr 1 vez al día.
> `0 13 * * *` = todos los días a las 1pm UTC = 10am Argentina.

---

## Paso 4 — Verificar el flujo completo

1. Verificar que el negocio demo exista en Supabase y tenga datos consistentes
2. Abrir https://reservaya.ar/demo-barberia
3. Crear una reserva completa con tu email
4. Verificar que llegue el email de confirmación (cliente y negocio)
5. Verificar que el link de "mi turno" permita reprogramar y cancelar
6. Verificar que el admin refleje los cambios en `/admin/dashboard`
7. Simular follow-up: llamar al cron con un booking completado y verificar que llega el email con link a `/[slug]/resena`
8. Forzar un error controlado en preview o staging y confirmar que aparezca en Sentry Issues
9. Revisar Sentry Performance y Replays para validar que tracing y session replay esten entrando

---

## Antes de pasar a producción real con clientes

- [ ] Supabase validado con backups, RLS y migrations aplicadas (`booking_locks`, `rate_limit_events`, `consume_rate_limit`, `subscription_payment_attempts`)
- [ ] Dominio propio comprado y configurado en Resend
- [ ] `RESEND_FROM_EMAIL` actualizado con dominio verificado
- [ ] Cron probado con reservas reales en ventana de 24hs
- [ ] MercadoPago: probar flujo sandbox completo (reserva → pago → confirmación)
- [ ] MercadoPago: copiar `MP_WEBHOOK_SECRET` desde Developers y verificar que el webhook firme eventos válidos para turnos y suscripciones
- [ ] WhatsApp Twilio configurado (opcional)
- [ ] Monitoreo básico activo (Vercel logs + alertas)
- [ ] Sentry Issues recibiendo errores de cliente y servidor
- [ ] Source maps confirmados en un error real de producción
- [ ] Alertas basicas creadas en Sentry (errores nuevos / regresiones)

---

## Assets para lanzamiento

- [ ] Video demo 30-45 segundos (landing → reserva → confirmación → admin)
- [ ] 3 capturas: landing, flujo de reserva, panel admin
- [ ] Post LinkedIn con CTA a demo o piloto
