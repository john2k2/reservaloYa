# Project State

## Nombre

ReservaYa

## Enfoque

Producto-servicio para vender turnos online a negocios chicos que hoy operan por WhatsApp.

## Decision tecnica principal

Arquitectura multi-tenant sobre Supabase como backend único para auth, datos y operación.

## Estado actual (2026-07-17)

### Flujo publico de reserva

- Landing personalizada por negocio y vertical (barberia, estetica, etc.)
- Selector de servicio con precio, duracion y etiqueta destacada
- Calendario interactivo con disponibilidad real (solo dias con horarios)
- Selector de hora agrupado por franja (Manana / Tarde / Noche)
- Skeleton loading inmediato al cambiar fecha
- Formulario con email requerido, telefono opcional
- Pago online via MercadoPago si el servicio tiene precio y el negocio conecto OAuth
- Pagina de confirmacion con link a calendario y gestion del turno
- Pagina "mi turno": reprogramar y cancelar desde link firmado
- Pagina de resena post-turno (`/[slug]/resena`) con rating y comentario
- Lista de espera (waitlist) cuando no hay horarios disponibles
- Politica de cancelacion visible por negocio
- Tema dark/light coherente en todas las paginas publicas
- Paginas legales `/privacidad` y `/terminos`
- Trust points de template ocultos en negocios reales (solo demos o branding custom)

### Notificaciones automaticas

- Email de confirmacion al cliente y al negocio (Resend, HTML inline)
- Email de recordatorio 24hs antes del turno
- Email de seguimiento post-turno (~1h despues) con link a resena
- WhatsApp recordatorio via Meta Cloud API / Twilio (opcional, complementa email)
- Historial de comunicaciones por booking en el store

### Admin

- Dashboard con KPIs reales (turnos, ingresos, conversion)
- Listado de turnos con filtros y cambios de estado
- Listado de clientes con historial
- CRUD completo de servicios (precio, duracion, destacado)
- Gestion de disponibilidad semanal y bloqueos especiales
- Branding profundo editable: logo, hero, galeria, paleta, redes
- Politica de cancelacion editable por negocio
- Integracion MercadoPago OAuth: boton de conexion por negocio (cobro de turnos)
- Onboarding: clonar demo y editar desde cero sin tocar codigo
- Signup siembra servicios y horarios desde plantilla del rubro

### Billing de plataforma (suscripcion SaaS)

- **Primario:** transferencia ARS (`BILLING_TRANSFER_*`) + activacion manual en panel platform ("Marcar pagado")
- **Primario:** Polar checkout USD + webhooks (`/api/payments/polar/*`)
- **Legacy:** MercadoPago de plataforma solo si `MP_ACCESS_TOKEN` esta configurado (cuenta de cobro cerrada; no es el camino de venta)

### Infraestructura

- Supabase para auth, base de datos y multi-tenant real
- Rate limiting en creacion de turnos con eventos/RPC en Supabase
- Locks de slots persistidos en Supabase para evitar doble reserva concurrente
- Tokens HMAC firmados para links de gestion y resena
- Endpoint de cron `/api/jobs/booking-reminders` para Vercel
- Analytics de embudo: page_view -> cta_click -> booking_page -> booking_created
- Tracking UTM en toda la cadena de reserva
- Deploy en Vercel + Supabase
- CI: lint + typecheck + test + build + coverage thresholds + smoke E2E

---

## Lo que falta para produccion real / primer cobro

### Ops (activar en Vercel / Polar / Supabase)

1. Aplicar migracion Polar (`polarSubscriptionId` / `polarCustomerId`) en Supabase prod
2. Cargar `POLAR_*` y `BILLING_TRANSFER_*` en Vercel Production + redeploy
3. Webhook Polar apuntando a `https://reservaya.ar/api/payments/polar/webhook`
4. Verificar cron dry-run y un flujo de reserva con email real
5. Confirmar `MP_WEBHOOK_SECRET` solo para cobros de turnos por negocio (no bloquea SaaS)

### GTM

6. Video demo 30-45s + capturas + post LinkedIn / piloto

### Post-lanzamiento

- Vercel Pro / re-habilitar image optimizer cuando haya MRR
- Profundizar analytics (GA4 / PostHog)
- Seleccion de profesional/staff por parte del cliente

---

## Criterio de cierre de esta iteracion

Un negocio piloto debe poder:

- Recibir reservas reales de sus clientes
- Recibir email de confirmacion automatico (cliente y negocio)
- Recibir recordatorio 24hs antes del turno
- Recibir follow-up post-turno con link para dejar resena
- Gestionar turnos desde el admin sin friccion
- Pagar la suscripcion SaaS por transferencia o Polar
- Cobrar turnos online via MercadoPago OAuth si lo desea

---

## Riesgo principal

Que el producto ya haga mucho, pero falten vars de cobro (Polar/transfer) o el operador no valide emails/cron, y el piloto no perciba valor.

## Regla operativa

Cada proximo cambio debe empujar una de estas metas:

- onboarding mas convincente
- producto mas vendible
- flujo de reserva mas real
- admin mas operable
