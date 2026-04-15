# Disaster Recovery — ReservaYa

**Última actualización**: 2026-04-15
**Responsable**: john2k2

---

## Dónde están los backups

Los backups diarios de PocketBase se suben a **Vercel Blob** automáticamente:

- **Store**: `reservaya-assets` en el proyecto Vercel `john2k2s-projects/reservaya`
- **Prefijo**: `backups/pb/`
- **Nombre**: `auto-YYYY-MM-DD-HH-MM-SS.zip`
- **Retención**: 30 días (los más viejos se purgan automáticamente)
- **Cron**: todos los días a las 03:00 AR (06:00 UTC) → `/api/jobs/pb-backup`

Para ver la lista de backups disponibles:

```bash
# Desde Vercel Dashboard → Storage → reservaya-assets → Browse → backups/pb/
# O via CLI:
vercel blob list --prefix backups/pb/
```

---

## Cómo descargar el último backup

```bash
# Listar y tomar la URL del más reciente
vercel blob list --prefix backups/pb/ | sort | tail -1

# O descargar directamente con la URL pública:
curl -o /tmp/pb-backup.zip "<URL del blob>"
```

---

## Restaurar PocketBase en un contenedor nuevo

### Escenario: Railway perdió el volumen / data corruptos

1. **Levantar Railway con PB vacío** (el volumen nuevo ya está vacío — no hacer nada extra).

2. **Descargar el último backup**:
   ```bash
   curl -o /tmp/pb-backup.zip "<URL del último backup de Vercel Blob>"
   ```

3. **Restaurar via API de PocketBase** (PB debe estar corriendo y accesible):
   ```bash
   PB_URL="https://<tu-dominio-railway>.railway.app"
   PB_EMAIL="tu-email-superuser"
   PB_PASS="tu-password"

   # 1. Obtener token de auth
   TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
     -H "Content-Type: application/json" \
     -d '{"identity":"'"$PB_EMAIL"'","password":"'"$PB_PASS"'"}' \
     | jq -r '.token')

   # 2. Subir el backup
   curl -s -X POST "$PB_URL/api/backups/upload" \
     -H "Authorization: $TOKEN" \
     -F "file=@/tmp/pb-backup.zip"

   # 3. Restaurar (reemplaza TODO — punto de no retorno)
   curl -s -X POST "$PB_URL/api/backups/auto-YYYY-MM-DD-HH-MM-SS/restore" \
     -H "Authorization: $TOKEN"
   ```

4. **Verificar restauración**:
   - Login en `$PB_URL/_/` con las credenciales de superuser.
   - Confirmar que aparecen las 18 colecciones.
   - Confirmar que los businesses y servicios demo están presentes.
   - Navegar a `/demo-barberia` en producción y confirmar que carga.

5. **Re-crear hook de email** si fue sobreescrito:
   ```bash
   # El hook vive en /pb_data/pb_hooks/main.pb.js en Railway
   # Si no se restauró con el backup, subir desde pocketbase/pb_hooks/main.pb.js del repo
   B64=$(base64 -w0 pocketbase/pb_hooks/main.pb.js)
   railway ssh --service=pocketbase "echo '$B64' | base64 -d > /pb_data/pb_hooks/main.pb.js"
   ```

---

## Restaurar en entorno local para validar (sin afectar prod)

```bash
# 1. Levantar PB limpio en puerto 8091
docker run -d --name pb-restore-test \
  -p 8091:8090 \
  -v pb-restore-data:/pb/pb_data \
  ghcr.io/muchobien/pocketbase:latest \
  serve --http=0.0.0.0:8090 --dir=/pb/pb_data

# 2. Crear superuser temporal
docker exec pb-restore-test /usr/local/bin/pocketbase \
  superuser upsert test@test.com testpass1234 --dir=/pb/pb_data

# 3. Restaurar (igual que paso 3 de arriba pero con localhost:8091)
PB_URL="http://localhost:8091"

# 4. Verificar en http://localhost:8091/_/

# 5. Limpiar
docker rm -f pb-restore-test && docker volume rm pb-restore-data
```

---

## Vercel durante ventana de downtime

Si PB está caído y necesitás poner el frontend en modo mantenimiento:

```bash
# Opción A: Variable de entorno que activa un banner o página de mantenimiento
# (si existe esta lógica en el código)

# Opción B: Redirect temporal en vercel.json (no recomendado para producción activa)
# Agregar un redirect de /* → /maintenance.html

# Opción C (más rápido): Desde Vercel Dashboard → Deployment → Roll back al deploy anterior
```

---

## Contacto de emergencia

| Servicio | Panel | Soporte |
|----------|-------|---------|
| Railway (PB) | https://railway.com/project/54a46ebe | Status: https://status.railway.app |
| Vercel (Next.js) | https://vercel.com/john2k2s-projects/reservaya | Status: https://vercel-status.com |
| Resend (email) | https://resend.com/overview | Status: https://status.resend.com |

---

## RTO / RPO objetivo

| Métrica | Objetivo |
|---------|---------|
| **RPO** (pérdida máx de datos) | 24h (backup diario a las 03:00 AR) |
| **RTO** (tiempo máx de restauración) | 2h (asumiendo backup accesible y PB respondiendo) |

Para reducir el RPO a <1h, ajustar el cron a cada hora en `vercel.json` y `0 * * * *`.
