# ReservaYa - Arquitectura actual

## Vision general

ReservaYa es una aplicacion de turnos online multi-tenant para negocios chicos.

El objetivo actual no es resolver la arquitectura final para escalar a gran volumen. El objetivo es tener:

- una demo comercial creible
- una app funcional para operar un negocio real
- una base tecnica simple de mantener

---

## Stack actual

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| UI | shadcn/ui |
| Backend / Auth / DB | Supabase |
| Email | Resend |
| Pagos | MercadoPago OAuth per-negocio + cuenta plataforma |
| Testing | Vitest + Testing Library |

---

## Modo de operacion

### Supabase-only

La app usa Supabase como backend unico para auth, datos y operacion multi-tenant.

- auth real de admin
- datos reales por negocio
- reservas, analytics, recordatorios, rate-limit y locks sobre Supabase
- migraciones versionadas en `supabase/migrations/`

No hay backend operativo PocketBase en el estado actual.

---

## Modelo multi-tenant

Cada negocio vive dentro de la misma app y la misma instancia.

Entidades principales:

- `businesses`
- `users`
- `services`
- `customers`
- `availability_rules`
- `blocked_slots`
- `bookings`
- `communication_events`
- `analytics_events`

Regla principal:

- todo lo sensible se filtra por `business_id`

---

## Estructura del proyecto

```txt
src/
  app/
    (public)/
      [slug]/
        page.tsx
        reservar/
          page.tsx
        confirmacion/
          page.tsx
        mi-turno/
          page.tsx
    admin/
      (panel)/
        dashboard/
        bookings/
        services/
        availability/
        customers/
        onboarding/
        settings/
      login/
    api/
      analytics/
      jobs/

  components/
    dashboard/
    landing/
    public/
    ui/

  lib/
    bookings/
    supabase/
    seo/
    utils.ts

  server/
    actions/
    queries/
    supabase-store/
    supabase-auth.ts
```

`/admin/settings` hoy existe como compatibilidad, pero el editor real esta centralizado en `/admin/onboarding`.

---

## Flujos principales

### Cliente final

1. entra a `/{slug}`
2. elige servicio
3. elige fecha y horario
4. completa sus datos
5. confirma la reserva
6. ve la confirmacion
7. puede usar el link para ver, reprogramar o cancelar

### Admin

1. inicia sesion
2. entra al dashboard
3. revisa turnos y clientes
4. edita la pagina publica del negocio
5. opera servicios, disponibilidad, turnos, clientes y suscripcion desde el panel

---

## Estado funcional real

### Ya operativo

- login admin
- dashboard
- clientes
- CRUD de servicios en admin
- gestion de disponibilidad en admin
- bloqueo de horarios desde admin
- acciones operativas sobre turnos desde admin
- pagina publica editable
- reserva publica
- confirmacion
- gestion del turno por link
- base de analytics
- base de recordatorios
- MercadoPago OAuth por negocio para turnos pagos
- suscripcion plataforma via MercadoPago con attempts historicos
- rate-limit y locks de slots persistidos en Supabase

### Todavia incompleto

- observabilidad/analytics avanzados post-lanzamiento
- seleccion publica de profesional/staff

Eso significa que la app ya sirve para operar pilotos reales, con mejoras post-lanzamiento pendientes.

---

## Reglas tecnicas

- TypeScript estricto
- validacion con Zod
- logica sensible siempre en servidor
- no confiar disponibilidad calculada solo en frontend
- evitar duplicacion de pantallas y flujos
- priorizar simplicidad sobre sobre-ingenieria

---

## Decision de infraestructura

Supabase es el backend actual y unico para auth, persistencia y operacion multi-tenant.

Las piezas operativas sensibles estan versionadas como migraciones Supabase, incluyendo:

- `booking_locks`
- `rate_limit_events`
- RPC `consume_rate_limit`
- `subscription_payment_attempts`

Hoy la regla es mantener la arquitectura simple: Supabase + Vercel, sin reintroducir un segundo backend salvo necesidad concreta.
