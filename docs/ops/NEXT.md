# Next

## Bloque actual

Llevar ReservaYa desde MVP completo a beta pública real: despliegue productivo, automatizaciones activas y primeros clientes piloto.

## Ultimo avance (2026-03-18)

- MercadoPago OAuth por negocio: cada negocio conecta su propia cuenta MP desde el admin
- Campo `cancellationPolicy` por negocio: editable en admin, visible en pagina publica
- Email post-turno (follow-up) con link a reseña integrado
- Recordatorios WhatsApp via Twilio (opcional, además de email)
- Lista de espera (waitlist): cliente se anota si no hay horarios disponibles
- Sistema de reseñas post-turno: link con token en follow-up email → pagina `/[slug]/resena`
- Paginas legales `/privacidad` y `/terminos` creadas
- Pagina de confirmacion y "mi turno" respetan tema dark/light del negocio
- Loading state del selector de fecha corregido (skeleton inmediato al cambiar fecha)
- Email requerido, telefono opcional en el formulario de reserva
- `npm run lint`, `npm run build` y `npm run test -- --run` pasando en verde

## Siguientes tareas

### Prioritarias (para lanzar)

1. Configurar `BOOKING_LINK_SECRET` y `CRON_SECRET` en Vercel (si no están)
2. Configurar `RESEND_API_KEY` para emails reales
3. Activar cron real de recordatorios y follow-ups
4. Validar flujo completo en produccion con reserva real

### Deseables (antes del primer cliente pago)

5. PocketBase deployado con backups y reglas least-privilege completas
6. Dominio propio en Resend para emails sin restriccion de destinatarios
7. CI minima: lint + test + build en PRs (RY-018)
8. Video demo 30-45s para lanzamiento comercial

## Criterio de cierre de la siguiente iteracion

Un negocio piloto debe poder:

- Recibir reservas reales de sus clientes
- Recibir email de confirmacion automatico (cliente y negocio)
- Recibir recordatorio 24hs antes del turno
- Recibir follow-up post-turno con link para dejar reseña
- Gestionar turnos desde el admin sin friccion
- Cobrar online via MercadoPago si lo desea

## Recordatorio

Actualizar este archivo y `PROJECT_STATE.md` al cerrar cada bloque importante.
