# Configuración de Emails con Resend

## Cómo funciona ahora

Los emails usan **HTML inline**, sin necesidad de Templates de Resend ni dominio propio verificado.

El `FROM` del email se resuelve así:
1. Si `RESEND_FROM_EMAIL` está configurado → lo usa
2. Si no → usa `onboarding@resend.dev` (dominio gratuito de Resend)

> Con `onboarding@resend.dev` solo podés enviar a emails verificados en tu cuenta Resend
> (modo test). Para enviar a cualquier destinatario en producción, necesitás dominio propio.

---

## Setup mínimo (funcional sin dominio)

### 1. Conseguir API Key de Resend

1. Crear cuenta en https://resend.com (gratis)
2. Ir a **API Keys** → **Create API Key**
3. Copiar la key

### 2. Configurar en Vercel

En tu proyecto Vercel → **Settings** → **Environment Variables**:

| Variable | Valor | Notas |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | Obligatorio |
| `RESEND_FROM_EMAIL` | (vacío o tu email) | Opcional |

Si dejás `RESEND_FROM_EMAIL` vacío, los emails salen desde `onboarding@resend.dev`.

### 3. Redeploy

Ir a **Deployments** → deploy reciente → **Redeploy**

---

## Setup con dominio propio (producción real)

Para enviar a cualquier email sin restricciones:

1. Comprar un dominio (ej: `reservaya.app` en Namecheap/GoDaddy)
2. En Resend → **Domains** → **Add Domain**
3. Configurar los registros DNS (SPF, DKIM, DMARC) que indica Resend
4. Esperar verificación (5-30 min)
5. Configurar: `RESEND_FROM_EMAIL=hola@tudominio.com`

---

## Emails que se envían

| Evento | Destinatario | Asunto |
|--------|--------------|--------|
| Nueva reserva | Cliente | ✅ Tu reserva en {negocio} está confirmada |
| Reprogramación | Cliente | ✅ Tu reserva en {negocio} fue reprogramada |
| Recordatorio 24h | Cliente | ⏰ Recordatorio: tu reserva en {negocio} es mañana |
| Nueva reserva | Negocio (admin) | 🎉 Nueva reserva: {servicio} - {cliente} |
| Reprogramación | Negocio (admin) | 📅 Reserva reprogramada: {servicio} - {cliente} |

---

## Probar sin enviar

```bash
npm run notifications:test -- --channel email --dry-run
```

## Probar con envío real

```bash
node scripts/test-notifications.mjs --channel email --email tu@email.com
```

---

## Troubleshooting

**Error "You can only send testing emails to your own email address"**
→ Estás usando `onboarding@resend.dev` sin dominio. Solo podés enviar a tu propio email verificado en Resend.
→ Solución: agregar el email destinatario como contacto en Resend, o configurar dominio propio.

**Los emails van a spam**
→ Configurar dominio propio con SPF + DKIM + DMARC.

**Error "RESEND_API_KEY is not configured"**
→ La variable no está cargada en el entorno. Verificar Vercel Settings → Environment Variables.
