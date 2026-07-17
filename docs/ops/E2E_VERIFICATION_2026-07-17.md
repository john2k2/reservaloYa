# Verificación E2E — 2026-07-17

Deploy: `https://reservaya.ar` (alias prod READY tras push billing + polish).

## Verificado OK

| Flujo | Resultado |
|-------|-----------|
| Landing `/` | HTTP 200 |
| Demo `/demo-barberia` | HTTP 200, servicios y horarios visibles |
| Reserva pública | Confirmada booking `8e674444-8d58-40c7-93c8-90b7e627bd20` (Corte clásico, 2026-07-20 09:00) |
| Confirmación | Página OK + link “Ver mi turno” con token `scope=manage` |
| Mi turno | Abre con Reprogramar / Cancelar |
| Cron dry-run | `{"ok":true,...,"businesses":5,"sent":0}` |
| Polar webhook sin config | HTTP 503 `polar_webhook_not_configured` (esperado) |
| Migración Polar Supabase | Aplicada (`polarSubscriptionId` / `polarCustomerId`) |
| `MP_WEBHOOK_SECRET` | Presente en Vercel Production |
| Pricing copy | “Transferencia o tarjeta” en landing |

## Pendiente de credenciales (acción tuya)

Seguí [`POLAR_TRANSFER_ACTIVATION.md`](./POLAR_TRANSFER_ACTIVATION.md):

1. Crear producto Polar USD 22 + webhook → `https://reservaya.ar/api/payments/polar/webhook`
2. Cargar en Vercel Production: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PRODUCT_ID`, `POLAR_SERVER`, `BILLING_TRANSFER_*`
3. Redeploy
4. Probar Polar sandbox → `active`
5. Probar transferencia → Platform “Marcar pagado” → `active`

Sin esos env, `/admin/subscription/pay` no muestra Polar ni transferencia (solo fallback manual / WhatsApp).

## Email

Reserva de QA enviada a `siimplemining@gmail.com` — revisar bandeja/Resend logs para confirmar entrega.
