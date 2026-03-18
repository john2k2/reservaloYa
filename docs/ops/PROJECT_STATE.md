# Project State

## Nombre

ReservaYa

## Enfoque

Producto-servicio para vender turnos online a negocios chicos que hoy operan por WhatsApp.

## Decision tecnica principal

Arquitectura multi-tenant sobre PocketBase self-hosted, con modo local persistente como fallback para demo comercial.

## Estado actual (2026-03-18)

### Flujo publico de reserva

- Landing personalizada por negocio y vertical (barberia, estetica, etc.)
- Selector de servicio con precio, duracion y etiqueta destacada
- Calendario interactivo con disponibilidad real (solo dias con horarios)
- Selector de hora agrupado por franja (Mañana / Tarde / Noche)
- Skeleton loading inmediato al cambiar fecha
- Formulario con email requerido, telefono opcional
- Pago online via MercadoPago si el servicio tiene precio (por negocio o global)
- Pagina de confirmacion con link a calendario y gestion del turno
- Pagina "mi turno": reprogramar y cancelar desde link firmado
- Pagina de reseña post-turno (`/[slug]/resena`) con rating y comentario
- Lista de espera (waitlist) cuando no hay horarios disponibles
- Politica de cancelacion visible por negocio
- Tema dark/light coherente en todas las paginas publicas
- Paginas legales `/privacidad` y `/terminos`

### Notificaciones automaticas

- Email de confirmacion al cliente y al negocio (Resend, HTML inline)
- Email de recordatorio 24hs antes del turno
- Email de seguimiento post-turno (~1h despues) con link a reseña
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

- Modo local (archivo JSON, sin dependencias externas) para demo
- Modo PocketBase para produccion multi-tenant real
- Rate limiting en creacion de turnos
- Tokens HMAC firmados para links de gestion y reseña
- Endpoint de cron `/api/jobs/booking-reminders` para Vercel
- Analytics de embudo: page_view → cta_click → booking_page → booking_created
- Tracking UTM en toda la cadena de reserva
- Deploy en Vercel, PocketBase via Docker local

## Ya validado

- Crear reserva local desde demo publica
- Ver confirmacion del turno y recibir email
- Reprogramar un turno desde su link publico
- Cancelar un turno desde su link publico
- Ver impacto del turno en el panel admin
- Analytics y conversion visibles en dashboard
- Editar branding y ver cambio reflejado en pagina publica
- Detectar recordatorios pendientes en ventana de 24hs
- Conectar MercadoPago OAuth por negocio desde admin
- Enviar follow-up post-turno con link a reseña
- Dejar reseña con rating y comentario desde link firmado

## Lo que falta para produccion real

### 1. Activacion de infraestructura

- Configurar `RESEND_API_KEY` para emails reales a cualquier destinatario
- Activar `CRON_SECRET` en Vercel y verificar el cron de recordatorios
- Deployar PocketBase en VPS o PaaS con backups diarios
- Configurar dominio propio en Resend para emails sin restriccion

### 2. Seguridad y hardening

- Completar rules least-privilege en PocketBase para flujos publicos (RY-001, RY-002)
- Rate limiting en login admin (RY-005)
- Endurecer autenticacion en endpoint de cron (RY-006)
- Revisar race condition en creacion concurrente de turnos (RY-007)

### 3. Operacion

- CI minima: lint + test + build en PRs (RY-018)
- Monitoreo y alertas basicas (Vercel logs + PocketBase health)
- Backups automaticos de PocketBase

### 4. Crecimiento (post-lanzamiento)

- Implementar lista de espera en PocketBase (hoy solo modo local)
- Implementar reseñas en PocketBase (hoy solo modo local)
- Seleccion de profesional/staff por parte del cliente
- GA4 o PostHog para analytics avanzado
- SEO: meta tags y OG por pagina de negocio

## Riesgo principal

Que el producto ya haga mucho, pero el operador no active los servicios clave (email, cron, dominio) y los clientes no reciban confirmaciones reales.

## Prioridad recomendada

1. Activar Resend con dominio y validar emails reales
2. Activar cron de recordatorios en Vercel
3. Deployar PocketBase en produccion
4. Validar end-to-end con primer cliente piloto real

## Regla operativa

Cada proximo cambio debe empujar una de estas metas:

- demo mas convincente
- producto mas vendible
- flujo de reserva mas real
- admin mas operable
