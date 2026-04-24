# Plan Pre-Lanzamiento ReservaYa

**Objetivo**: cerrar los 4 gaps identificados en la auditoría del 2026-04-15 para habilitar lanzamiento público.

**Estado actual**: prod corre estable para piloto cerrado. Booking flow, seguridad, persistencia y CI validados.

> Nota 2026-04-24: este plan conserva pasos historicos del pre-lanzamiento. El backend actual es Supabase-only; cualquier referencia a PocketBase/Railway queda obsoleta y no debe ejecutarse.

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

> Estado 2026-04-24: la implementacion PocketBase de esta seccion quedo reemplazada por Supabase. Para operacion actual, validar backups del proyecto Supabase y que esten aplicadas las migraciones `20260424000000_add_booking_locks_rate_limit_events.sql` y `20260424001000_add_subscription_payment_attempts.sql`.

**Tiempo estimado**: 3-4h (incluye probar restore)
**Bloquea lanzamiento**: SÍ (si perdemos datos con clientes reales, game over)

### Contexto

PocketBase expone `pb.backups.create()` y `pb.backups.getFullList()`. Un backup es un ZIP completo del estado (data.db + attachments). Lo descargamos vía HTTP autenticado y lo subimos a Vercel Blob con retención de 30 días.

### BK.1 — Crear script de backup

Archivo: `scripts/ops/backup-pocketbase.mjs`

```javascript
#!/usr/bin/env node
/**
 * Crea un backup de PocketBase y lo sube a Vercel Blob.
 * Retiene los últimos 30 días; los anteriores se borran.
 *
 * Uso local: node scripts/ops/backup-pocketbase.mjs
 * Uso cron (Vercel): GET /api/jobs/pb-backup con Authorization: Bearer $CRON_SECRET
 */
import { put, list, del } from "@vercel/blob";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const RETENTION_DAYS = 30;

export async function runBackup() {
  if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASS || !BLOB_TOKEN) {
    throw new Error("Faltan env vars: PB_URL/ADMIN/BLOB_TOKEN");
  }

  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);

  // 1. Pedir a PB que cree el backup
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const backupName = `auto-${timestamp}.zip`;
  await pb.backups.create(backupName);

  // 2. Descargar el zip del backup
  const fileToken = await pb.files.getToken();
  const downloadUrl = `${PB_URL}/api/backups/${backupName}?token=${fileToken}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // 3. Subir a Vercel Blob
  const blobPath = `backups/pb/${backupName}`;
  const uploaded = await put(blobPath, buffer, {
    access: "public",
    token: BLOB_TOKEN,
    addRandomSuffix: false,
  });

  // 4. Borrar el backup de PocketBase (ya lo tenemos en Blob)
  await pb.backups.delete(backupName);

  // 5. Purgar backups viejos en Blob
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const { blobs } = await list({ prefix: "backups/pb/", token: BLOB_TOKEN });
  const toDelete = blobs.filter((b) => new Date(b.uploadedAt).getTime() < cutoff);
  for (const old of toDelete) {
    await del(old.url, { token: BLOB_TOKEN });
  }

  return {
    backup: uploaded.url,
    size: buffer.length,
    purged: toDelete.length,
  };
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup()
    .then((r) => {
      console.log("Backup OK:", JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error("Backup FAILED:", e);
      process.exit(1);
    });
}
```

### BK.2 — Instalar dependencia

```bash
npm install @vercel/blob
```

Verificar que `@vercel/blob` queda en `dependencies` (no devDependencies) porque lo usa el cron en runtime.

### BK.3 — Test manual local

```bash
# Con .env.production.local cargado (ojo: backup va a prod Blob)
node --env-file=.env.production --env-file=.env.production.local scripts/ops/backup-pocketbase.mjs
```

Validar:
- Output muestra URL del blob y tamaño >0.
- En Vercel Dashboard → Storage → `reservaya-assets` → aparece `backups/pb/auto-YYYY-MM-DD-HH-MM-SS.zip`.
- Bajar el zip manualmente y abrirlo: debe tener `data.db`, `auxiliary.db`, carpeta `storage/`.

**Done when**: backup local corrido con éxito, zip bajado y verificado.

### BK.4 — Crear endpoint cron

Archivo: `src/app/api/jobs/pb-backup/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createLogger } from "@/server/logger";
import { runBackup } from "../../../../../scripts/ops/backup-pocketbase.mjs";

const logger = createLogger("PB Backup Cron");

// Vercel Functions: permitir hasta 5 min para un backup grande
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET no configurado");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBackup();
    logger.info("Backup completo", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("Backup falló", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

**Nota sobre el import**: si TypeScript se queja de importar `.mjs`, mover `runBackup` a `src/server/pb-backup.ts` y que tanto el script CLI como el endpoint lo importen.

### BK.5 — Agregar cron a vercel.json

Editar `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/jobs/booking-reminders",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/jobs/pb-backup",
      "schedule": "0 6 * * *"
    }
  ]
}
```

`0 6 * * *` = todos los días a las 06:00 UTC = 03:00 AR.

### BK.6 — Deploy y verificar cron

```bash
vercel --prod
```

- En Vercel Dashboard → proyecto → Settings → Crons → debe aparecer `/api/jobs/pb-backup @ 0 6 * * *`.
- Test manual inmediato:
```bash
CRON=$(vercel env pull /tmp/.env.tmp --environment=production --yes && grep CRON_SECRET /tmp/.env.tmp | cut -d'"' -f2)
curl -s -H "Authorization: Bearer $CRON" https://reservaya.ar/api/jobs/pb-backup
```
Debe responder `{"ok":true,"backup":"https://...blob...zip","size":N,"purged":0}`.

### BK.7 — Validar restore (CRÍTICO)

Esto NO es opcional. Un backup que no se puede restaurar es un backup ficticio.

1. Bajar el último zip de Blob a local:
   ```bash
   curl -o /tmp/pb-backup.zip "<blob-url-del-paso-anterior>"
   ```
2. Levantar una PocketBase local nueva:
   ```bash
   docker run -d --name pb-restore-test \
     -p 8091:8090 \
     -v pb-restore-data:/pb/pb_data \
     ghcr.io/muchobien/pocketbase:latest \
     serve --http=0.0.0.0:8090 --dir=/pb/pb_data
   ```
3. Crear superuser temporal: `docker exec pb-restore-test /usr/local/bin/pocketbase superuser upsert test@test.com testpass1234 --dir=/pb/pb_data`.
4. Login en http://localhost:8091/_/ con esas credenciales.
5. Settings → Import collections (o usar `pb.backups.upload` vía API) → cargar el zip.
6. Confirmar que aparecen las 18 colecciones y los 4 businesses.
7. Limpiar: `docker rm -f pb-restore-test && docker volume rm pb-restore-data`.

**Done when**: restore probado en entorno limpio y datos verificados.

### BK.8 — Documentar procedimiento de recovery

Crear `docs/ops/DISASTER_RECOVERY.md` con:
- Dónde están los backups (Vercel Blob, prefijo `backups/pb/`).
- Cómo descargar el último.
- Comandos paso a paso para restaurar en un PB nuevo.
- Qué hacer con Vercel durante la ventana de downtime.

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
- [ ] Revisar Vercel Blob: último backup hoy.
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
- [ ] Sección BK — Backup automático
- [ ] Sección WA — WhatsApp productivo
- [ ] Sección V — Validación final
- [ ] 🚀 Lanzamiento público
