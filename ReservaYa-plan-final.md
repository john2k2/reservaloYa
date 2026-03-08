# ReservaYa — Plan completo y final

## 1. Resumen ejecutivo

**ReservaYa** es un sistema de turnos online para barberías, peluquerías y centros de estética chicos.

La propuesta no es vender “una web”, sino resolver un problema operativo concreto:

- menos tiempo perdido respondiendo WhatsApp
- menos desorden con los turnos
- menos ausencias gracias a recordatorios
- una imagen más profesional frente al cliente

### Objetivo de fase 1
Cerrar el **primer cliente pago** con una versión simple, estable y fácil de demostrar.

### Enfoque correcto
No arrancar como SaaS gigante.
Arrancar como **servicio-producto**:

- instalación inicial
- personalización liviana
- abono mensual

Después de validar ventas, se estandariza más.

---

## 2. Nicho inicial

### Nicho elegido
**Barberías / peluquerías / estética chica**

### Por qué este nicho
- entienden rápido el valor
- ya usan WhatsApp como canal principal
- suelen tener agenda manual o desordenada
- la demo se entiende en minutos
- el cierre comercial suele ser más simple que salud/consultorios

### Nichos futuros posibles
- dentistas particulares
- nutricionistas
- kinesiólogos
- tatuadores
- profesionales independientes por turno

Pero en fase 1 no se abre a todos.

---

## 3. Propuesta de valor

### Promesa principal
**Tus clientes reservan solos. Vos trabajás más ordenado.**

### Pitch corto
Ayudo a barberías, peluquerías y centros de estética a ordenar sus turnos con una página simple donde sus clientes pueden reservar solos, recibir recordatorios y consultar por WhatsApp sin depender de responder todo manualmente.

### Problemas que resuelve
- toman turnos por mensaje
- se pisan horarios
- tardan en responder
- pierden tiempo operativo
- clientes faltan o cancelan tarde
- no tienen historial claro

### Resultado esperado
- reservas 24/7
- agenda más ordenada
- menos fricción para el cliente
- menos tiempo operativo
- mejor presencia digital

---

## 4. Oferta comercial

## Producto base
Sistema de turnos online + panel admin + recordatorios por email + integración operativa con WhatsApp.

### Incluye
- mini sitio o landing del negocio
- reserva online
- catálogo de servicios
- selección de fecha/hora
- carga de datos del cliente
- confirmación del turno
- panel admin simple
- gestión de horarios
- bloqueo de franjas
- recordatorios por email
- botón de contacto directo por WhatsApp

### No incluye en MVP
- app móvil nativa
- pagos online
- chatbot
- automatización avanzada de WhatsApp
- múltiples sucursales complejas
- reportes avanzados

---

## 5. Modelo de negocio

### Forma de cobro
**Setup + mensualidad**

### Precio sugerido para arrancar
- **Setup:** USD 150
- **Mensual:** USD 20

### Rango aceptable inicial
- setup: USD 120–250
- mensual: USD 15–40

### Extras cobrables
- dominio
- carga inicial de contenido
- branding más personalizado
- integración futura con Google Calendar
- recordatorios avanzados
- soporte prioritario

### Por qué este modelo es el correcto
- cobrís el trabajo inicial
- evitás regalar horas
- mantenés ingreso mensual
- el cliente entiende mejor el valor instalado

---

## 6. Stack final elegido

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend / DB / Auth
- Supabase
  - PostgreSQL
  - Auth
  - Storage si hace falta
  - Row Level Security

## Email
- Resend

## Deploy
- Vercel

## Analytics
- básico al inicio
- Vercel Analytics o eventos simples propios

---

## 7. Por qué usar Supabase

### Decisión final
**Sí, usar Supabase.**

### Pero con una regla crítica
**No hacer 1 proyecto por cliente.**

Se hace una sola plataforma **multi-tenant**, con todos los negocios dentro del mismo proyecto, aislados con `business_id` y políticas de acceso.

### Motivo
Supabase en el plan free da **2 proyectos activos** y los proyectos free pueden pausarse por inactividad, así que usar uno por cliente sería una mala arquitectura. En cambio, un solo proyecto multi-tenant evita ese problema y encaja con el uso correcto de Postgres + RLS. Supabase además documenta que RLS es la forma de aplicar autorización granular a nivel de fila, integrada con Supabase Auth. citeturn0search0turn0search1turn0search4turn0search13

### Beneficios reales de esta decisión
- menos infraestructura
- menos despliegues
- menos mantenimiento
- menor costo inicial
- más velocidad para vender

---

## 8. Arquitectura del sistema

## Enfoque
Aplicación multi-tenant simple.

Cada negocio tiene:
- sus servicios
- sus horarios
- sus reservas
- sus clientes
- sus usuarios/admins

Todo está asociado a `business_id`.

## Reglas de arquitectura
- validaciones críticas siempre en backend
- no confiar disponibilidad calculada solo en frontend
- usar RLS para aislar datos por negocio
- usar roles simples en fase 1
- mantener el dominio del negocio claro desde el principio

---

## 9. Entidades principales

### businesses
- id
- name
- slug
- phone
- email
- address
- logo_url
- timezone
- active
- created_at

### profiles
- id
- auth_user_id
- business_id
- full_name
- role
- active
- created_at

### services
- id
- business_id
- name
- description
- duration_minutes
- price
- active
- created_at

### staff
- id
- business_id
- full_name
- role
- active
- created_at

### customers
- id
- business_id
- full_name
- phone
- email
- notes
- created_at

### availability_rules
- id
- business_id
- staff_id nullable
- day_of_week
- start_time
- end_time
- active

### blocked_slots
- id
- business_id
- staff_id nullable
- blocked_date
- start_time
- end_time
- reason

### bookings
- id
- business_id
- customer_id
- service_id
- staff_id nullable
- booking_date
- start_time
- end_time
- status
- notes
- reminder_24_sent
- reminder_2_sent
- created_at

### notification_logs
- id
- business_id
- booking_id
- channel
- template_key
- status
- sent_at
- error_message

---

## 10. Estados de un turno

Usar pocos estados.

- `pending`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

No agregar más hasta que haya una necesidad real.

---

## 11. Flujo del cliente final

1. entra al link del negocio
2. ve servicios disponibles
3. elige servicio
4. elige fecha
5. ve horarios disponibles
6. completa nombre y teléfono
7. confirma el turno
8. recibe confirmación por pantalla y por email
9. tiene botón para contactar por WhatsApp si necesita ayuda

---

## 12. Flujo del admin

1. inicia sesión
2. entra al dashboard
3. ve turnos del día o semana
4. confirma/cancela/completa turnos
5. administra servicios
6. define disponibilidad
7. bloquea horarios especiales
8. revisa clientes

---

## 13. Pantallas MVP

### Públicas
- Home del negocio (`/[slug]`)
- Reserva (`/[slug]/reservar`)
- Confirmación (`/[slug]/confirmacion`)

### Admin
- Login (`/admin/login`)
- Dashboard (`/admin/dashboard`)
- Turnos (`/admin/bookings`)
- Servicios (`/admin/services`)
- Disponibilidad (`/admin/availability`)
- Clientes (`/admin/customers`)
- Configuración básica (`/admin/settings`)

---

## 14. Features MVP cerradas

### Sí entra
- auth admin
- CRUD de servicios
- reglas de disponibilidad
- bloqueo de franjas horarias
- reserva pública
- validación contra solapamientos
- dashboard simple
- estados de turnos
- listado de clientes
- email de confirmación
- recordatorio por email
- diseño responsive

### No entra
- pagos online
- WhatsApp automatizado full
- app mobile
- multi-sucursal compleja
- membresías/promos
- estadísticas avanzadas
- lista de espera

---

## 15. Estructura técnica sugerida

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
    admin/
      login/
        page.tsx
      dashboard/
        page.tsx
      bookings/
        page.tsx
      services/
        page.tsx
      availability/
        page.tsx
      customers/
        page.tsx
      settings/
        page.tsx

  components/
    booking/
    dashboard/
    forms/
    layout/
    ui/

  lib/
    supabase/
    validations/
    booking/
    auth/
    utils/

  server/
    actions/
    queries/

  types/
  constants/
```

---

## 16. Reglas técnicas clave

- TypeScript estricto
- Zod para validación
- lógica sensible en servidor
- prevenir doble reserva por condiciones de carrera
- fechas/horarios tratados con cuidado
- RLS habilitado en tablas sensibles
- separar queries, validaciones y UI

Supabase recomienda habilitar RLS en producción y usar políticas razonables, porque tablas sin RLS pueden exponer acceso no deseado desde clientes. citeturn0search1turn0search17

---

## 17. SQL inicial base

```sql
create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  address text,
  logo_url text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner', 'admin', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  role text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  check (start_time < end_time)
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  blocked_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  check (start_time < end_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  staff_id uuid references public.staff(id) on delete set null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  reminder_24_sent boolean not null default false,
  reminder_2_sent boolean not null default false,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  template_key text not null,
  status text not null,
  sent_at timestamptz,
  error_message text
);
```

---

## 18. Seguridad y acceso

### Estrategia
- cada usuario admin/staff pertenece a un negocio
- cada fila sensible tiene `business_id`
- las políticas de acceso filtran por el negocio del usuario

### Regla operativa
No exponer queries sin RLS a clientes.

### Patrón sugerido
- admin/owner: acceso a datos de su negocio
- staff: acceso restringido si más adelante hace falta
- públicas: ciertas lecturas de servicios/disponibilidad vía lógica controlada

---

## 19. Emails

### Proveedor
**Resend**

### Uso inicial
- confirmación de reserva
- recordatorio 24 hs antes
- recordatorio 2 hs antes

### Motivo
Resend tiene plan gratuito de **3.000 emails/mes** con **100 emails/día**, y además tiene documentación específica para uso con Next.js. Para una etapa inicial con pocos negocios, alcanza de sobra. citeturn0search2turn0search18

---

## 20. Hosting

### Proveedor
**Vercel**

### Motivo
- despliegue rápido para Next.js
- flujo simple con GitHub
- sirve bien para MVP y primeras ventas

Vercel mantiene plan Hobby gratuito para proyectos personales o de pequeña escala, suficiente para arrancar un MVP y demos. citeturn0search3turn0search7turn0search15

---

## 21. Roadmap de 30 días

## Semana 1 — Base
- definir branding mínimo
- crear repo
- inicializar proyecto Next.js
- configurar Supabase
- crear tablas
- configurar auth admin
- diseñar wireframes simples

## Semana 2 — Núcleo
- CRUD de servicios
- disponibilidad
- reserva pública
- cálculo de slots disponibles
- validación backend
- dashboard simple

## Semana 3 — Comunicación y pulido
- confirmación por email
- recordatorio por email
- UX responsive
- datos fake de demo
- landing comercial del producto
- video demo corto

## Semana 4 — Ventas
- armar lista de 50 leads
- contactar negocios
- mostrar demo
- conseguir feedback
- cerrar primer cliente
- instalar primera instancia real dentro del sistema multi-tenant

---

## 22. Sprint 1 técnico

### Objetivo
Dejar lista la base funcional del proyecto.

### Tareas
- crear repo y README
- setup Next.js + TS + Tailwind
- instalar shadcn/ui
- crear proyecto Supabase
- configurar variables de entorno
- armar schema SQL
- auth admin básica
- seeds de negocio demo
- layout público
- layout admin

### Entregable
Proyecto corriendo localmente con auth y DB conectada.

---

## 23. Sprint 2 técnico

### Objetivo
Completar el flujo de reserva pública.

### Tareas
- catálogo de servicios
- lógica de disponibilidad
- cálculo de slots
- formulario de reserva
- creación de customer + booking
- pantalla de confirmación
- validación de solapamientos

### Entregable
Usuario final puede reservar un turno real en entorno demo.

---

## 24. Sprint 3 técnico

### Objetivo
Completar el panel admin.

### Tareas
- dashboard con turnos del día
- listado de turnos
- filtros por estado
- CRUD de servicios
- gestión de disponibilidad
- bloqueo de horarios
- listado de clientes

### Entregable
Negocio puede operar la agenda desde el panel.

---

## 25. Sprint 4 técnico/comercial

### Objetivo
Dejarlo vendible.

### Tareas
- emails con Resend
- mejora UI mobile
- landing de ReservaYa
- pricing visible
- video demo 30–60 segundos
- base de leads
- mensajes de prospección

### Entregable
Demo comercial lista para mostrar.

---

## 26. Estrategia de venta

## Canal principal
Prospección manual local.

### Dónde buscar
- Google Maps
- Instagram
- Facebook
- negocios de barrio
- cuentas que toman turnos por DM/WhatsApp

### Qué detectar
- no tienen web
- tienen web vieja
- toman turnos manualmente
- no muestran sistema claro de reservas
- el proceso depende de responder mensajes

---

## 27. Mensajes de prospección

### Mensaje 1
Hola, ¿cómo va? Vi que manejan turnos por WhatsApp/Instagram. Estoy ayudando a negocios como el suyo a ordenar reservas con una página simple donde los clientes pueden sacar turno solos y recibir recordatorios. Si querés, te muestro una demo corta.

### Mensaje 2
La idea es que pierdas menos tiempo respondiendo, tengas más orden con la agenda y una imagen más profesional frente al cliente.

### Mensaje 3 — seguimiento
Si te interesa, te muestro una demo en 2 minutos y te digo cuánto costaría dejarlo funcionando para tu negocio.

---

## 28. Demo comercial

### Guion
1. mostrar home del negocio
2. mostrar servicios
3. reservar un turno
4. mostrar confirmación
5. mostrar panel admin
6. mostrar listado de turnos
7. mostrar cómo bloquear horarios

### Duración ideal
2 a 4 minutos.

---

## 29. Material comercial mínimo

- nombre: ReservaYa
- logo simple
- landing del producto
- demo funcional
- video corto
- plan de precios
- mensajes de contacto
- planilla de leads

---

## 30. Lista de leads

### Objetivo inicial
50 leads locales.

### Campos de planilla
- negocio
- rubro
- zona
- Instagram
- WhatsApp
- web
- si usa agenda online
- observaciones
- estado del contacto

### Meta real
- 50 contactos
- 10 respuestas
- 5 demos
- 1 cierre

---

## 31. Pricing final recomendado

### Plan Inicio
- setup: USD 150
- mensual: USD 20

### Plan Pro
- setup: USD 250
- mensual: USD 35

### Diferencia
El plan pro puede incluir:
- branding más prolijo
- configuración más completa
- soporte prioritario
- mejoras menores mensuales

---

## 32. Riesgos y cómo evitarlos

### Riesgo 1
Construir demasiado antes de vender.

**Solución:** demo rápida y salir a prospectar.

### Riesgo 2
Querer meter WhatsApp automatizado full desde el día 1.

**Solución:** email + botón WhatsApp + operación simple.

### Riesgo 3
Abrirse a demasiados rubros.

**Solución:** nicho único al inicio.

### Riesgo 4
Cobrar barato por inseguridad.

**Solución:** setup desde el primer cliente.

### Riesgo 5
Hacer un proyecto Supabase por cliente.

**Solución:** arquitectura multi-tenant en un solo proyecto.

---

## 33. Decisiones finales cerradas

### Nombre
**ReservaYa**

### Nicho inicial
**Barberías / peluquerías / estética chica**

### Stack
- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Supabase
- Resend
- Vercel

### Modelo de negocio
**Setup + mensualidad**

### Arquitectura
**Multi-tenant con un solo proyecto Supabase**

### Objetivo inicial
**Cerrar 1 cliente pago**

---

## 34. Próximos pasos exactos

1. crear repo base
2. armar README + PROJECT_STATE + NEXT
3. generar schema SQL real
4. construir Sprint 1
5. armar demo con datos fake
6. salir a buscar 50 leads
7. mostrar demo
8. cerrar primer cliente

---

## 35. Conclusión

La jugada correcta para ReservaYa no es hacer “el mejor SaaS del mundo”.

La jugada correcta es esta:

- producto simple
- nicho claro
- stack rápido
- una sola infraestructura bien pensada
- demo corta
- venta directa
- primer cliente pago cuanto antes

Después de eso recién se optimiza, se automatiza más y se escala.
