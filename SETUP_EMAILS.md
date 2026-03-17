# 📧 Configuración de Emails en Producción

## Resumen

Tu aplicación ya está configurada para enviar emails de confirmación de turnos usando **Resend**. Solo necesitas agregar las variables de entorno en Vercel.

## Variables a Configurar

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `RESEND_API_KEY` | `re_481FzGcB_PCPo4E6CD8jcCGgkNuusshaU` | API Key de Resend |
| `RESEND_FROM_EMAIL` | `ortiz.jonathan2k@gmail.com` | Email del remitente |

## Pasos para Configurar en Vercel

### 1. Entrar al Dashboard de Vercel

1. Andá a https://vercel.com/dashboard
2. Seleccioná tu proyecto `reservaya-kappa`
3. Andá a la pestaña **"Settings"** (Configuración)

### 2. Agregar Variables de Entorno

1. En el menú lateral, hacé clic en **"Environment Variables"**
2. Agregá la primera variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_481FzGcB_PCPo4E6CD8jcCGgkNuusshaU`
   - **Environment:** ✅ Production
   - Clic en **"Add"**

3. Agregá la segunda variable:
   - **Name:** `RESEND_FROM_EMAIL`
   - **Value:** `ortiz.jonathan2k@gmail.com`
   - **Environment:** ✅ Production
   - Clic en **"Add"**

### 3. Redeploy

1. Andá a la pestaña **"Deployments"**
2. Encontrá el deploy más reciente
3. Clic en los **tres puntos** (...) → **"Redeploy"**
4. Esperá 2-3 minutos a que termine el build

## Verificación

Para probar que los emails funcionan:

1. Andá a https://reservaya-kappa.vercel.app/demo-barberia
2. Completá una reserva con tu email real
3. Deberías recibir un email de confirmación en minutos

## Configuración Adicional en Resend (Recomendado)

Para que los emails no vayan a spam:

1. Andá a https://resend.com/domains
2. Agregá tu dominio personalizado (ej: `reservaya.app`)
3. Seguí las instrucciones de verificación DNS
4. Actualizá `RESEND_FROM_EMAIL` con tu dominio verificado

## Flujos de Email Activos

Una vez configurado, se enviarán automáticamente:

| Evento | Destinatario | Contenido |
|--------|--------------|-----------|
| Nueva reserva | Cliente | Confirmación con detalles del turno |
| Reprogramación | Cliente | Nuevo horario y link de gestión |
| Recordatorio (24hs antes) | Cliente | Recordatorio con opción de cancelar |

## Solución de Problemas

### No llegan los emails
- Verificá en la carpeta de **Spam/Promociones**
- Revisá los logs en Vercel: Dashboard → Functions → Logs
- Verificá que la API Key sea correcta

### Error "From email not verified"
- El email `ortiz.jonathan2k@gmail.com` debe estar verificado en Resend
- Andá a https://resend.com/emails y verificá el dominio

### Emails van a spam
- Usá un dominio propio en lugar de Gmail
- Configurá SPF, DKIM y DMARC en tu DNS

## Soporte

- **Documentación Resend:** https://resend.com/docs
- **Soporte Vercel:** https://vercel.com/help
