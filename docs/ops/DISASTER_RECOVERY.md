# Disaster Recovery — ReservaYa

**Ultima actualizacion**: 2026-04-24
**Responsable**: john2k2

---

## Estado actual

ReservaYa opera con **Supabase-only** para auth, base de datos y persistencia multi-tenant. Las referencias anteriores a PocketBase/Railway quedaron obsoletas.

---

## Backups y restore

Los backups se gestionan desde Supabase:

- **Proyecto**: `reservaloYa`
- **Ref**: `jshlqmfggyzbnwjejkyb`
- **Datos criticos**: `businesses`, `users`, `services`, `availability_rules`, `blocked_slots`, `customers`, `bookings`, `subscriptions`, `subscription_payment_attempts`, `rate_limit_events`, `booking_locks`

Para restaurar, usar el panel de Supabase o soporte de Supabase segun el plan activo. Antes de cualquier restore productivo, exportar el estado actual y documentar el punto de restauracion.

---

## Verificacion post-restore

1. Confirmar que auth funciona para admin y platform.
2. Confirmar que RLS y credenciales server-side estan intactas.
3. Confirmar que existen las migraciones operativas:
   - `booking_locks`
   - `rate_limit_events`
   - RPC `consume_rate_limit`
   - `subscription_payment_attempts`
4. Abrir `https://reservaya.ar/demo-barberia` y validar que carga servicios y disponibilidad.
5. Crear una reserva de prueba sin pago.
6. Probar un flujo sandbox de MercadoPago si el incidente afecto pagos o webhooks.

---

## Vercel durante ventana de downtime

Si Supabase esta caido o inconsistente y necesitás poner el frontend en modo mantenimiento:

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
| Supabase | https://supabase.com/dashboard/project/jshlqmfggyzbnwjejkyb | Status: https://status.supabase.com |
| Vercel (Next.js) | https://vercel.com/john2k2s-projects/reservaya | Status: https://vercel-status.com |
| Resend (email) | https://resend.com/overview | Status: https://status.resend.com |

---

## RTO / RPO objetivo

| Metrica | Objetivo |
|---------|---------|
| **RPO** (perdida max de datos) | Segun backup disponible en Supabase |
| **RTO** (tiempo max de restauracion) | 2h, asumiendo acceso al proyecto y backup valido |
