# Project State

## Nombre

ReservaYa

## Enfoque

Producto-servicio para vender turnos online a negocios chicos que hoy operan por WhatsApp.

## Decision tecnica principal

Arquitectura multi-tenant sobre Supabase como backend único para auth, datos y operación.

## Estado actual (2026-03-26)

### Flujo publico de reserva

- Landing personalizada por negocio y vertical (barberia, estetica, etc.)
- Selector de servicio con precio, duracion y etiqueta destacada
- Calendario interactivo con disponibilidad real (solo dias con horarios)
- Selector de hora agrupado por franja (Manana / Tarde / Noche)
- Skeleton loading inmediato al cambiar fecha
- Formulario con email requerido, telefono opcional
- Pago online via MercadoPago si el servicio tiene precio (por negocio o global)
- Pagina de confirmacion con link a calendario y gestion del turno
- Pagina "mi turno": reprogramar y cancelar desde link firmado
- Pagina de resena post-turno (`/[slug]/resena`) con rating y comentario
- Lista de espera (waitlist) cuando no hay horarios disponibles
- Politica de cancelacion visible por negocio
- Tema dark/light coherente en todas las paginas publicas
- Paginas legales `/privacidad` y `/terminos`

### Notificaciones automaticas

- Email de confirmacion al cliente y al negocio (Resend, HTML inline)
- Email de recordatorio 24hs antes del turno
- Email de seguimiento post-turno (~1h despues) con link a resena
- WhatsApp recordatorio via Twilio (opcional, complementa email)
- Historial de comunicaciones por booking en el store

### Admin

- Dashboard con KPIs reales (turnos, ingresos, conversion)
- Listado de turnos con filtros y cambios de estado
- Listado de clientes con historial
- CRUD completo de servicios (precio, duracion, destacado)
- Gestion de disponibilidad semanal y bloqueos especiales
- Branding profundo editable: logo, hero, galeria, paleta, redes
- Politica de cancelacion editable por negocio
- Integracion MercadoPago OAuth: boton de conexion por negocio
- Onboarding: clonar demo y editar desde cero sin tocar codigo

### Infraestructura

- Supabase para auth, base de datos y multi-tenant real
- Rate limiting en creacion de turnos
- Tokens HMAC firmados para links de gestion y resena
- Endpoint de cron `/api/jobs/booking-reminders` para Vercel
- Analytics de embudo: page_view -> cta_click -> booking_page -> booking_created
- Tracking UTM en toda la cadena de reserva
- Deploy en Vercel + Supabase
- CI: lint + typecheck + test + build + coverage thresholds + smoke E2E

---

## Lo que falta para produccion real

### Prioritario (para lanzar)

1. Configurar `RESEND_API_KEY` para emails reales
2. Configurar `BOOKING_LINK_SECRET` y `CRON_SECRET` en Vercel
3. Activar cron real de recordatorios y follow-ups
4. Validar flujo completo en produccion con reserva real

### Antes del primer cliente pago

5. Supabase validado con backups, RLS y credenciales correctas en todos los entornos
6. Dominio propio en Resend para emails sin restriccion de destinatarios
7. Video demo 30-45s para lanzamiento comercial

### Post-lanzamiento

- Profundizar analytics y observabilidad sobre Supabase
- Seleccion de profesional/staff por parte del cliente
- Seleccion de profesional/staff por parte del cliente
- GA4 o PostHog para analytics avanzado
- SEO: meta tags y OG por pagina de negocio

---

## Criterio de cierre de la siguiente iteracion

Un negocio piloto debe poder:

- Recibir reservas reales de sus clientes
- Recibir email de confirmacion automatico (cliente y negocio)
- Recibir recordatorio 24hs antes del turno
- Recibir follow-up post-turno con link para dejar resena
- Gestionar turnos desde el admin sin friccion
- Cobrar online via MercadoPago si lo desea

---

## Riesgo principal

Que el producto ya haga mucho, pero el operador no active los servicios clave (email, cron, dominio) y los clientes no reciban confirmaciones reales.

## Regla operativa

Cada proximo cambio debe empujar una de estas metas:

- onboarding mas convincente
- producto mas vendible
- flujo de reserva mas real
- admin mas operable
