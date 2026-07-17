# Activación Polar + transferencia (ops)

Guía operativa para dejar el cobro SaaS live. **No pegues secrets en el chat ni en commits.**

## 1. Migración Supabase (prod)

Desde el repo, con proyecto linkeado:

```bash
supabase db push
# o aplicar solo:
# supabase migration up --include-all
```

Migración: `supabase/migrations/20260715010000_add_polar_subscription_ids.sql`

Verificar columnas en tabla `subscriptions`:

- `polarSubscriptionId`
- `polarCustomerId`

## 2. Cuenta Polar

1. Crear org en [Polar](https://polar.sh) (sandbox primero).
2. Producto recurrente: **ReservaYa** — **USD 22 / mes**.
3. Copiar `POLAR_PRODUCT_ID`.
4. Access token de organización → `POLAR_ACCESS_TOKEN`.
5. Webhook:
   - URL: `https://reservaya.ar/api/payments/polar/webhook`
   - Eventos: `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`, `order.paid`
   - Secret → `POLAR_WEBHOOK_SECRET`
6. `POLAR_SERVER=sandbox` hasta validar; luego `production`.

## 3. Transferencia ARS

En Vercel Production:

| Variable | Ejemplo |
|----------|---------|
| `BILLING_TRANSFER_ALIAS` | tu.alias.mp |
| `BILLING_TRANSFER_CBU` | (opcional) |
| `BILLING_TRANSFER_HOLDER` | Titular |
| `BILLING_TRANSFER_BANK` | Banco |

Activación manual: Platform → negocios → **Marcar pagado**.

## 4. Vercel env + redeploy

```bash
vercel env add POLAR_ACCESS_TOKEN production
vercel env add POLAR_WEBHOOK_SECRET production
vercel env add POLAR_PRODUCT_ID production
vercel env add POLAR_SERVER production   # valor: sandbox | production
vercel env add BILLING_TRANSFER_ALIAS production
vercel env add BILLING_TRANSFER_HOLDER production
# opcionales: BILLING_TRANSFER_CBU, BILLING_TRANSFER_BANK

vercel --prod
```

## 5. Smoke post-deploy

1. Abrir `/admin/subscription/pay` logueado → deben verse transferencia y/o Polar.
2. Polar sandbox: checkout de prueba → webhook → suscripción `active`.
3. Transferencia: transferir → Platform **Marcar pagado** → `active`.
4. Cron dry-run:

```bash
curl "https://reservaya.ar/api/jobs/booking-reminders?dryRun=true" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 6. No bloqueantes

- `MP_WEBHOOK_SECRET` / `MP_APP_ID` / `MP_APP_SECRET`: solo para cobro de **turnos** por negocio.
- WhatsApp Meta/Twilio: opcional; email Resend ya cubre el canal principal.
