# Plan Pre-Lanzamiento ReservaYa

**Objetivo**: cerrar los 4 gaps identificados en la auditoría del 2026-04-15 para habilitar lanzamiento público.

**Estado actual**: prod corre estable para piloto cerrado. Booking flow, seguridad, persistencia y CI validados.

> Nota 2026-05-01: el plan está alineado con backend Supabase-only. No reintroducir infraestructura PocketBase/Railway.

**Audiencia**: este plan está escrito para ser ejecutado por un agente (Sonnet 4.6) o un humano paso a paso. Cada sección es autocontenida con comandos, archivos y criterios de validación.

---

## Orden de ejecución recomendado

```
Día 0   │ WA.1  Arrancar aprobación Meta template WhatsApp (bloqueante externo, 1-3 días)
Día 1   │ S.1-4 Sentry end-to-end
Día 1   │ B.1-3 Vercel Blob para branding
Día 2-3 │ BK.1-5 Validación de backups/migrations Supabase
Día 3-5 │ ⏳ Esperando aprobación Meta; mientras correr piloto suegra
Día 5-7 │ WA.2-4 WhatsApp productivo configurado y probado
Día 7   │ ✅ Lanzamiento público (peluquería externa + Linkedin)
```

---

## Sección S — Sentry (error tracking)

**Tiempo estimado**: 2-3h
**Bloquea lanzamiento**: SÍ

### Contexto

El código ya está preparado. Archivos existentes:
- `src/sentry.server.config.ts`
- `src/sentry.edge.config.ts`
- `src/instrumentation.ts`
- `src/instrumentation-client.ts`
- `src/lib/monitoring/sentry.ts`

Solo faltan las variables de entorno y validar que captura errores reales.

### S.1 — Crear proyecto en Sentry

1. Ir a https://sentry.io → Sign up / Login con GitHub.
2. Create Project:
   - Platform: **Next.js**
   - Alert frequency: "Alert me on every new issue"
   - Project name: `reservaya-prod`
   - Team: default
3. Copiar el DSN que muestra (formato: `https://xxxxx@oyyy.ingest.sentry.io/zzzzz`).

**Done when**: tenés el DSN copiado.

### S.2 — Agregar env vars a Vercel producción

```bash
# Desde el repo, autenticado en vercel CLI
vercel env add SENTRY_DSN production
# Pegar el DSN cuando lo pida
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Pegar el MISMO DSN
vercel env add SENTRY_ENVIRONMENT production
# Valor: production
```

Opcionales (dejar sin setear usa defaults del código):
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (default 0.1 = 10%)
- `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` (default 0.1)
- `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` (default 1.0)

**Done when**: `vercel env ls production | grep SENTRY` muestra las 3 vars.

### S.3 — Redeploy y verificar init

```bash
vercel --prod
```

Esperar READY. Después:

```bash
# Verificar que Sentry se inicializó en el server
vercel logs <deployment-url> --since 5m | grep -i sentry
```

**Done when**: logs no muestran errores de "Sentry not initialized" o DSN inválido.

### S.4 — Disparar error real y verificar captura

Crear un endpoint temporal para forzar un error:

```typescript
// src/app/api/debug/sentry-test/route.ts (BORRAR DESPUÉS DE VALIDAR)
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  throw new Error("Sentry validation — ignorar, es intencional");
}
```

Deploy, disparar:

```bash
# Usar el CRON_SECRET como llave para no dejarlo abierto
CRON=$(vercel env pull /tmp/.env.tmp --environment=production --yes && grep CRON_SECRET /tmp/.env.tmp | cut -d'"' -f2)
curl -s "https://reservaya.ar/api/debug/sentry-test?key=$CRON"
```

1. Ir al dashboard Sentry → Issues. Debe aparecer "Sentry validation — ignorar" dentro de ~30s.
2. Marcar el issue como "Resolved" desde el dashboard.
3. **Borrar el endpoint** `src/app/api/debug/sentry-test/route.ts`.
4. Commit: `chore(monitoring): validar Sentry en prod`.

**Done when**: issue apareció en Sentry, endpoint eliminado, commit pusheado.

### S.5 — Configurar alertas

En Sentry dashboard → Alerts → Create Alert:

- **Alert 1 — "High error volume"**:
  - When: `The issue is seen by 10 users in 1 hour`
  - Send to: email del fundador
- **Alert 2 — "New issue"**:
  - When: `A new issue is created`
  - Send to: email del fundador (quizás con throttling si molesta)

**Done when**: 2 alertas creadas y activas.

---

## Sección B — Vercel Blob para branding uploads

**Tiempo estimado**: 30 min
**Bloquea lanzamiento**: NO (fallback funciona, pero feo para cliente real)

### B.1 — Crear Blob store

1. Vercel Dashboard → proyecto reservaya → Storage tab → Create Database.
2. Seleccionar **Blob** (no Postgres ni KV).
3. Name: `reservaya-assets`.
4. Region: `Washington, D.C., USA (iad1)` (misma que el compute).
5. Link al proyecto `reservaya` automáticamente.

**Done when**: `vercel env ls production | grep BLOB_READ_WRITE_TOKEN` muestra la var.

### B.2 — Verificar que el código la usa correctamente

Revisar `src/server/branding-upload.ts` líneas 60-70:

```typescript
if (process.env.BLOB_READ_WRITE_TOKEN) {
  // usa Vercel Blob
}
if (process.env.NODE_ENV === "production") {
  // fallback error si falta
}
```

Confirmar que el flujo completo está implementado (upload, get URL, delete on replace).

### B.3 — Redeploy y test manual

```bash
vercel --prod
```

Test desde el panel admin:
1. Login como owner del business demo en https://reservaya.ar/login.
2. Ir a `/admin/settings` (o donde esté el upload de logo).
3. Subir una imagen de prueba.
4. Verificar que la URL resultante es `*.public.blob.vercel-storage.com`.
5. Confirmar que se renderiza en `/demo-barberia` como logo.

**Done when**: imagen subida desde admin aparece en página pública.

---

## Sección BK — Backups y migrations Supabase

**Estado 2026-05-01**: sección actualizada a Supabase-only. Se eliminaron los pasos históricos de PocketBase y Railway.

**Tiempo estimado**: 1-2h técnico + prueba de restore según plan de Supabase.
**Bloquea lanzamiento**: SÍ antes de clientes reales.

### Contexto

ReservaYa ya no opera PocketBase. La continuidad de datos depende del proyecto Supabase de producción y de que las migraciones aplicadas coincidan con el contrato de la app.

### BK.1 — Verificar migraciones requeridas

Confirmar en Supabase que estén aplicadas, como mínimo:

- `20260424000000_add_booking_locks_rate_limit_events.sql`
- `20260424001000_add_subscription_payment_attempts.sql`

Validar también las tablas/funciones que usa la app:

- `booking_locks`
- `rate_limit_events`
- RPC `consume_rate_limit`
- `subscription_payment_attempts`

### BK.2 — Backups Supabase

1. Entrar al dashboard de Supabase del proyecto productivo.
2. Confirmar plan y política de backups disponible para el proyecto.
3. Descargar o restaurar un backup de prueba cuando el plan lo permita.
4. Documentar fecha, responsable y resultado en `docs/ops/DISASTER_RECOVERY.md`.

### BK.3 — Ensayo de recovery

Antes del primer cliente pago:

1. Crear un proyecto Supabase de staging/restore.
2. Aplicar migraciones desde `supabase/migrations`.
3. Cargar un dataset mínimo o restaurar backup según disponibilidad del plan.
4. Apuntar variables de entorno de preview/staging al proyecto restaurado.
5. Correr smoke público y flujo de reserva contra staging.

**Done when**: hay evidencia de restore funcional y la app puede reservar contra el entorno restaurado.

---

## Sección WA — WhatsApp Twilio productivo

**Tiempo estimado**: 1-2h técnico + 1-3 días espera Meta
**Bloquea lanzamiento**: PARCIAL (podés arrancar piloto sin WA, pero sin WA no hay recordatorios → mucha cancelación no-show)

### WA.1 — Upgrade Twilio a cuenta paga [DÍA 0 — HACELO YA]

1. https://console.twilio.com → Billing → Upgrade from Trial.
2. Cargar tarjeta. Monto inicial sugerido: USD 20 (alcanza para ~200 mensajes).
3. Validar que desaparezca el banner "Trial account".

### WA.2 — Registrar número WhatsApp Business con Meta

1. Twilio Console → Messaging → Senders → WhatsApp senders → **Start registration**.
2. Opciones:
   - **Opción A (rápida, recomendada)**: comprar número de Twilio ($1-3/mes) y registrarlo.
   - **Opción B**: portar tu número personal/empresa (requiere baja previa del número actual en WhatsApp app).
3. Completar Meta Business Manager:
   - Business name: ReservaYa
   - Website: https://reservaya.ar
   - Email de contacto: hola@reservaya.ar
4. Esperar verificación de Meta (**1-3 días hábiles**).

**Done when**: el número aparece como "Approved" en Twilio → WhatsApp senders.

### WA.3 — Crear y aprobar template de confirmación

Plantilla mínima requerida (hay más de una según el flujo, ver `src/server/booking-notifications.ts`):

1. Twilio Console → Messaging → Content Template Builder → Create.
2. Template name: `reservaya_booking_confirmation`.
3. Category: **Transactional** (no Marketing).
4. Language: `es_AR`.
5. Body:
   ```
   Hola {{1}}! Tu turno en {{2}} está confirmado para {{3}} a las {{4}}.
   Si necesitás cancelar o cambiar: {{5}}
   ```
6. Submit for approval. Tarda ~1 día hábil.
7. **Repetir para `reservaya_booking_reminder`** (recordatorio 24h antes) usando `src/server/booking-notifications.ts` como referencia de qué campos se envían.

**Done when**: ambos templates aparecen en estado "Approved".

### WA.4 — Actualizar env vars y deployar

```bash
vercel env rm TWILIO_WHATSAPP_FROM production
vercel env add TWILIO_WHATSAPP_FROM production
# Valor: whatsapp:+54911XXXXXXXX (el número productivo aprobado)

vercel env rm TWILIO_WHATSAPP_TEMPLATE_SID production
vercel env add TWILIO_WHATSAPP_TEMPLATE_SID production
# Valor: HXxxxxxxxxxxxxx (SID del template confirmation aprobado)

vercel --prod
```

### WA.5 — Smoke test con número real

1. En panel admin, crear un business de test y agendar un turno a tu propio número de WhatsApp.
2. Confirmar que llega:
   - Confirmación inmediata con los datos correctos.
   - Recordatorio al día siguiente (o forzar corriendo el cron manual).
3. Responder al mensaje con "Gracias" y confirmar que no rompe nada.

**Done when**: ambos tipos de mensaje llegan a un número real y se ven bien.

---

## Sección V — Validación final pre-lanzamiento

Después de completar S + B + BK + WA, correr este checklist antes de anunciar.

### V.1 — Health check completo

```bash
bash scripts/ops/smoke-prod.sh  # crear si no existe
```

Si no existe, crearlo con:
```bash
#!/usr/bin/env bash
set -e
BASE="https://reservaya.ar"
echo "Home:"       ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/
echo "Demo:"       ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/demo-barberia
echo "Reservar:"   ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/demo-barberia/reservar
echo "Login:"      ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/login
echo "Slots API:"  ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" "$BASE/api/public/booking-slots?slug=demo-barberia&date=2026-04-17&serviceId=mmaqg2dpl85fss2"
echo "Sitemap:"    ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/sitemap.xml
echo "Robots:"     ; curl -sf -o /dev/null -w "  %{http_code} %{time_total}s\n" $BASE/robots.txt
echo "Todo OK"
```

### V.2 — Checklist manual

- [ ] Agendar un turno real desde incógnito en `/demo-barberia/reservar` como si fueras cliente.
- [ ] Recibir email de confirmación en < 30s.
- [ ] Recibir WhatsApp de confirmación en < 60s.
- [ ] Entrar al link de "gestionar turno" del email → cancelar el turno.
- [ ] Recibir email de cancelación.
- [ ] Login como owner → ver que el turno cancelado aparece en el panel.
- [ ] Subir un logo custom al business en /admin/settings.
- [ ] Verificar que aparece en la landing pública.
- [ ] Revisar Sentry: 0 errores en la última hora.
- [ ] Revisar Supabase: backup/restore o migraciones validadas según `docs/ops/DISASTER_RECOVERY.md`.
- [ ] Revisar Vercel logs: ningún `[ERROR]` en la última hora.

### V.3 — Preparar comunicación de lanzamiento

- Post LinkedIn ya redactado (usar contenido de memoria de sesión anterior).
- Mensaje WhatsApp para suegra con link del panel: preparar aparte.
- Mensaje para peluquería externa: usar plantilla con CTA a onboarding.

---

## Apéndice — Qué NO hacemos ahora

1. **Migración a Supabase**: completada. No reintroducir PocketBase/Railway salvo una necesidad concreta que justifique operar dos backends.

2. **Observability avanzada** (OpenTelemetry, traces distribuidos): Sentry + Vercel Logs cubren el 95% de lo que se necesita en pre-PMF.

3. **Tests e2e de todos los flujos**: los 270 unit tests + el smoke manual de V.2 son suficientes. Playwright e2e se agrega cuando haya un bug recurrente que justifique el mantenimiento.

4. **Rate limiting a nivel edge**: el rate-limit de aplicacion usa Supabase (`rate_limit_events` + RPC `consume_rate_limit`) y Vercel agrega proteccion DDoS. Edge rate limiting dedicado queda para una necesidad concreta.

---

## Checklist de estado

Marcar a medida que se completa cada sección:

- [ ] Sección S — Sentry
- [ ] Sección B — Vercel Blob
- [ ] Sección BK — Backups/migrations Supabase
- [ ] Sección WA — WhatsApp productivo
- [ ] Sección V — Validación final
- [ ] 🚀 Lanzamiento público
