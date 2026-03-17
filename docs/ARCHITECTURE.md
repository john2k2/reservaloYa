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
| Backend / Auth / DB | PocketBase |
| Email | Resend |
| Testing | Vitest + Testing Library |

---

## Modos de operacion

### 1. Modo local

Se usa cuando PocketBase no esta configurado.

- datos persistidos en archivo JSON
- util para demo y desarrollo
- permite mostrar el producto sin backend externo

### 2. Modo PocketBase

Se usa cuando hay variables de entorno configuradas.

- auth real de admin
- datos reales por negocio
- reservas, analytics y recordatorios sobre PocketBase

La app ya soporta ambos modos, pero la direccion tecnica actual es PocketBase.

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
    pocketbase/
    seo/
    utils.ts

  server/
    actions/
    queries/
    local-store.ts
    pocketbase-store.ts
    pocketbase-auth.ts
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
5. pendiente de completar: operar servicios, disponibilidad y turnos desde el panel

---

## Estado funcional real

### Ya operativo

- login admin
- dashboard
- clientes
- pagina publica editable
- reserva publica
- confirmacion
- gestion del turno por link
- base de analytics
- base de recordatorios

### Todavia incompleto

- CRUD de servicios en admin
- gestion de disponibilidad en admin
- bloqueo de horarios desde admin
- acciones operativas sobre turnos desde admin

Eso significa que la app ya sirve muy bien como demo avanzada, pero todavia no cumple completo el admin operativo final.

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

PocketBase se mantiene como backend actual.

La decision futura entre:

- seguir con PocketBase en VPS
- o migrar a otra infraestructura

queda para despues de validar ventas y uso real.

Hoy la regla es:

- app funcional primero
- arquitectura definitiva despues
