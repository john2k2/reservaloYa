# Go Live Checklist

## URL actual

- Preview/alias actual: `https://reservaya-kappa.vercel.app`

## Lo que ya esta listo

- App desplegada en Vercel
- Build productivo pasando
- Tests pasando
- CRUD de servicios operativo
- Disponibilidad y bloqueos operativos
- Edicion de turnos desde admin operativa
- Endpoint de recordatorios listo para cron
- Soporte de recordatorios por WhatsApp preparado a nivel codigo

## Variables a cargar en Vercel

### Minimas para demo publica

- `NEXT_PUBLIC_APP_URL`
- `BOOKING_LINK_SECRET`
- `CRON_SECRET`

### Para PocketBase real

- `NEXT_PUBLIC_POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`
- `POCKETBASE_PUBLIC_AUTH_EMAIL`
- `POCKETBASE_PUBLIC_AUTH_PASSWORD`

### Para email

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Para WhatsApp

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WHATSAPP_TEMPLATE_SID`

## Verificaciones antes de publicar en LinkedIn

1. Resetear la demo con `npm run demo:reset` si se va a mostrar el modo local.
2. Confirmar que la barberia demo tenga servicios, horarios y turnos prolijos.
3. Crear una reserva completa desde la pagina publica.
4. Verificar la pantalla de confirmacion.
5. Verificar que el link de `mi turno` permita reprogramar y cancelar.
6. Verificar que el admin refleje el cambio.
7. Ejecutar recordatorios en modo prueba:

```bash
curl "https://reservaya-kappa.vercel.app/api/jobs/booking-reminders?dryRun=true" ^
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## Antes de pasar a produccion real

1. Cargar credenciales de Resend.
2. Cargar credenciales de Twilio WhatsApp.
3. Configurar PocketBase productivo con backup.
4. Validar el cron real en Vercel.
5. Reemplazar cualquier copy que prometa WhatsApp si el canal todavia no esta activo.

## Assets para lanzamiento

- Video corto de 30-45 segundos
- 3 capturas: landing, flujo de reserva, admin
- Texto del post con CTA a pilotos o demos
