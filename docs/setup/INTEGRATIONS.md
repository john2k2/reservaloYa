# Integraciones

Guia de configuracion para los servicios externos de ReservaYa.

---

## Resend (email)

### Como funciona

Los emails usan HTML inline, sin Templates de Resend ni dominio propio obligatorio.

El `FROM` se resuelve asi:
1. Si `RESEND_FROM_EMAIL` esta configurado -> lo usa
2. Si no -> usa `onboarding@resend.dev` (solo envia a emails verificados en tu cuenta Resend)

Para enviar a cualquier destinatario en produccion, necesitas dominio propio.

### Variables

| Variable | Obligatorio | Notas |
|----------|-------------|-------|
| `RESEND_API_KEY` | Si | `re_xxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | No | Si vacio, usa `onboarding@resend.dev` |

### Setup con dominio propio

1. En Resend -> Domains -> Add Domain
2. Configurar registros DNS (SPF, DKIM, DMARC) que indica Resend
3. Esperar verificacion (5-30 min)
4. Configurar: `RESEND_FROM_EMAIL=hola@tudominio.com`

### Emails que se envian

| Evento | Destinatario | Asunto |
|--------|--------------|--------|
| Nueva reserva | Cliente | Tu reserva en {negocio} esta confirmada |
| Reprogramacion | Cliente | Tu reserva en {negocio} fue reprogramada |
| Recordatorio 24h | Cliente | Recordatorio: tu reserva en {negocio} es manana |
| Nueva reserva | Negocio | Nueva reserva: {servicio} - {cliente} |
| Reprogramacion | Negocio | Reserva reprogramada: {servicio} - {cliente} |
| Follow-up post-turno | Cliente | Link para dejar resena |

### Probar

```bash
npm run notifications:test -- --channel email --dry-run    # sin enviar
node scripts/dev/test-notifications.mjs --channel email --email tu@email.com  # envio real
```

### Troubleshooting

- **"You can only send testing emails to your own email address"**: Estas usando `onboarding@resend.dev` sin dominio. Agrega el destinatario como contacto en Resend, o configura dominio propio.
- **Emails van a spam**: Configurar dominio propio con SPF + DKIM + DMARC.
- **"RESEND_API_KEY is not configured"**: Verificar Vercel Settings -> Environment Variables.

---

## Twilio WhatsApp (opcional)

Complementa los recordatorios por email. Si no se configura, el sistema funciona igual.

### Variables

| Variable | Notas |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | |
| `TWILIO_AUTH_TOKEN` | |
| `TWILIO_WHATSAPP_FROM` | Formato `whatsapp:+14155238886` |
| `TWILIO_WHATSAPP_TEMPLATE_SID` | Template con 6 variables: nombre, negocio, servicio, fecha, hora, link |

### Probar

```bash
node scripts/dev/test-notifications.mjs --channel whatsapp --phone +5491155550101
```

---

## MercadoPago

### Como funciona

Cada negocio conecta su propia cuenta MercadoPago via OAuth desde el admin para cobrar turnos pagos.

Cuando un servicio tiene precio y MP esta conectado:
1. La reserva se crea con `status: "pending_payment"`
2. Se crea una preferencia y el cliente va al checkout de MP
3. MP redirige a `/[slug]/confirmacion?payment=success|failure|pending`
4. El webhook `/api/payments/webhook` actualiza el booking a `confirmed`

Sin precio o sin MP conectado, el flujo sigue normal (sin pago).

La suscripcion mensual de ReservaYa se cobra con la cuenta plataforma (`MP_ACCESS_TOKEN`). Ese flujo persiste cada intento en `subscription_payment_attempts`; el webhook valida firma, monto, moneda y referencia externa contra el attempt historico antes de activar la suscripcion.

### Variables

| Variable | Notas |
|----------|-------|
| `MP_APP_ID` | ID de la app de plataforma |
| `MP_APP_SECRET` | Secret de la app de plataforma |
| `MP_ACCESS_TOKEN` | Access token de la cuenta plataforma para suscripciones |
| `MP_WEBHOOK_SECRET` | Secret para validar firmas del webhook; requerido en produccion |
| `NEXT_PUBLIC_APP_URL` | Requerido para los back_urls de MP |

### Configurar webhook

1. En MercadoPago Developers -> tu app -> Webhooks
2. URL: `https://tu-dominio.com/api/payments/webhook`
3. Eventos: `payment` (created, updated)

### Modo sandbox

Usar Access Token de sandbox (`TEST-xxxxxx`) y tarjetas de prueba de MP.

### Flujo de estados

| Evento | Estado del booking |
|--------|-------------------|
| Booking creado con precio | `pending_payment` |
| Cliente paga y MP aprueba | `confirmed` (via webhook) |
| Cliente cancela / pago rechazado | sigue `pending_payment` |

### Reembolsos

Se hacen manualmente desde el panel de MercadoPago. El webhook actualiza `paymentStatus` a `refunded`, pero el booking debe cancelarse manualmente desde el admin.

---

## Analytics (tracking)

### Eventos activos

| Evento | Que mide | Trigger |
|--------|----------|---------|
| `public_page_view` | Vista a pagina publica | Carga de `/{slug}` |
| `booking_cta_clicked` | Clic en CTA de reserva | Click en botones de `/{slug}` |
| `booking_page_view` | Entrada al flujo de reserva | Carga de `/{slug}/reservar` |
| `booking_created` | Reserva creada | Confirmacion del form |

Todas las propiedades incluyen `source`, `medium`, `campaign`, `pagePath`.

### UTM

Si llegan `utm_source`, `utm_medium` o `utm_campaign`, se guardan. Si no, la fuente queda como `direct`.

### Limitaciones

- Sin integracion con GA4 o PostHog todavia
- Sin filtros por fecha ni comparativas en admin
