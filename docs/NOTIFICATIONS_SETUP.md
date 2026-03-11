# Notifications Setup

## Objetivo

Dejar operativos:

- emails transaccionales con `Resend`
- recordatorios por WhatsApp con `Twilio`

## Variables requeridas

### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Twilio WhatsApp

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WHATSAPP_TEMPLATE_SID`

### Variables utiles para prueba

- `NOTIFICATIONS_TEST_EMAIL`
- `NOTIFICATIONS_TEST_PHONE`
- `NEXT_PUBLIC_APP_URL`
- `BOOKING_LINK_SECRET`

## Notas operativas

- `RESEND_FROM_EMAIL` debe pertenecer a un dominio verificado en Resend.
- `TWILIO_WHATSAPP_FROM` debe tener formato `whatsapp:+14155238886`.
- `NOTIFICATIONS_TEST_PHONE` debe estar en formato internacional, por ejemplo `+5491155550101`.
- La plantilla de Twilio debe aceptar 6 variables:
  - `1`: nombre del cliente
  - `2`: negocio
  - `3`: servicio
  - `4`: fecha
  - `5`: hora
  - `6`: link de gestion

## Probar sin enviar

```bash
npm run notifications:test -- --channel both --dry-run
```

## Probar email real

```bash
node scripts/test-notifications.mjs --channel email --email tu@email.com
```

## Probar WhatsApp real

```bash
node scripts/test-notifications.mjs --channel whatsapp --phone +5491155550101
```

## Flujo real en producto

- confirmacion de turno:
  - se envia por email si `RESEND_API_KEY` esta configurada y el cliente dejo email
- recordatorios:
  - se envian por email y/o WhatsApp segun canal disponible
  - el job vive en `/api/jobs/booking-reminders`

## Limitaciones actuales

- WhatsApp depende de que el telefono del cliente este en formato internacional valido.
- Sin `Resend` y `Twilio`, el sistema sigue funcionando pero los jobs quedan en modo `readyWithoutProvider` o `missingEmail`.
