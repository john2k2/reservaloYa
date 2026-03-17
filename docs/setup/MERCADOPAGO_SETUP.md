# Configuración de MercadoPago

## Cómo funciona

Cuando un servicio tiene precio y `MP_ACCESS_TOKEN` está configurado:

1. Cliente completa el form de reserva
2. La reserva se crea con `status: "pending_payment"`
3. Se crea una preferencia en MercadoPago y el cliente es redirigido al checkout de MP
4. Después del pago, MP redirige al cliente a `/[slug]/confirmacion?payment=success|failure|pending`
5. MP también llama al webhook `/api/payments/webhook` que actualiza el booking a `confirmed`

Si el servicio no tiene precio configurado, o si `MP_ACCESS_TOKEN` no está, el flujo sigue siendo el normal (sin pago).

---

## Setup

### 1. Crear app en MercadoPago

1. Ir a https://www.mercadopago.com.ar/developers/panel/app
2. Crear nueva aplicación
3. Copiar el **Access Token de producción** (o el de sandbox para pruebas)

### 2. Configurar variable de entorno

En Vercel → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `MP_ACCESS_TOKEN` | `APP_USR-xxxxxx` (producción) o `TEST-xxxxxx` (sandbox) |
| `NEXT_PUBLIC_APP_URL` | `https://reservaya-kappa.vercel.app` (requerido para los back_urls) |

### 3. Configurar webhook en MercadoPago

1. Ir a https://www.mercadopago.com.ar/developers/panel/app → tu app → Webhooks
2. Configurar URL: `https://reservaya-kappa.vercel.app/api/payments/webhook`
3. Eventos a recibir: `payment` (created, updated)

> El webhook es el que confirma automáticamente la reserva cuando el pago es aprobado.
> Sin webhook, la reserva queda en `pending_payment` hasta que el cliente vuelva al sitio.

### 4. Configurar precio en los servicios

Los servicios sin precio (`null` o `0`) no activan el flujo de pago.
Agregar precio desde el admin en: **Servicios → editar servicio → Precio**.

---

## Modo sandbox (pruebas)

Para probar sin pagos reales:
1. Usar Access Token de sandbox (`TEST-xxxxxx`)
2. Usar tarjetas de prueba de MP: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## Flujo de estados

| Evento | Estado del booking |
|--------|-------------------|
| Booking creado con precio | `pending_payment` |
| Cliente paga → MP aprueba | `confirmed` (vía webhook) |
| Cliente cancela el pago | sigue `pending_payment` |
| Pago rechazado | sigue `pending_payment` |

Los bookings `pending_payment` que no se pagan en 30min se pueden limpiar con un cron job (no implementado aún).

---

## Refund / reembolso

Los reembolsos deben hacerse manualmente desde el panel de MercadoPago.
El webhook actualiza el `paymentStatus` a `refunded` cuando MP confirma el reembolso.
El `bookingStatus` del booking **no cambia automáticamente** — debe cancelarse manualmente desde el admin.
