# ReservaYa - Plan funcional y comercial

## 1. Objetivo

ReservaYa es un sistema de turnos online para barberias, peluquerias y estetica chica.

Objetivo inmediato:

- tener una demo creible
- tener una app funcional para operar un negocio real
- cerrar el primer cliente pago

No estamos optimizando la arquitectura final todavia. Primero tiene que ser vendible y usable.

---

## 2. Nicho inicial

Nicho elegido:

- barberias
- peluquerias
- centros de estetica chicos

Por que:

- entienden rapido el valor
- ya trabajan por WhatsApp
- la demo se explica facil
- el problema operativo es claro

---

## 3. Propuesta de valor

Promesa:

**Tus clientes reservan solos. Vos trabajas mas ordenado.**

Problemas que resuelve:

- menos mensajes manuales
- menos horarios pisados
- menos tiempo perdido
- menos ausencias sin recordatorio
- mejor imagen frente al cliente

---

## 4. Oferta comercial

Producto base:

- pagina publica del negocio
- reserva online
- panel admin
- gestion de servicios
- gestion de disponibilidad
- clientes
- recordatorios por email
- boton de contacto por WhatsApp

No entra en MVP:

- pagos online
- app mobile nativa
- automatizacion avanzada de WhatsApp
- multi-sucursal compleja
- reportes avanzados

---

## 5. Modelo de negocio

Forma de cobro:

- setup inicial
- mensualidad

Precio sugerido inicial:

- Setup: USD 150
- Mensual: USD 20

---

## 6. Stack actual

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend / DB / Auth:

- PocketBase
- una sola instancia multi-tenant
- auth simple
- datos aislados por `business_id`

Email:

- Resend

Deploy:

- app en Vercel mas adelante
- PocketBase local por ahora
- despues se decide si PocketBase va a VPS o si conviene migrar

---

## 7. Decision de arquitectura actual

Decision:

**Usar PocketBase ahora y no distraernos con una migracion temprana.**

Regla:

**No abrir una instancia por cliente en fase 1.**

Enfoque:

- una sola instancia
- multiples negocios
- cada negocio con sus propios servicios, turnos, clientes y reglas
- validaciones y filtros por `business_id`

Motivo:

- hoy importa vender y demostrar
- PocketBase permite avanzar rapido
- evita sobre-ingenieria antes de validar ventas

---

## 8. Flujo del cliente final

1. entra al link del negocio
2. ve los servicios
3. elige servicio
4. elige fecha
5. ve horarios disponibles
6. completa nombre y telefono
7. confirma el turno
8. recibe confirmacion por pantalla
9. puede recibir email de confirmacion
10. puede contactar por WhatsApp si necesita ayuda

---

## 9. Flujo del admin esperado

1. inicia sesion
2. entra al dashboard
3. revisa turnos del dia o semana
4. confirma, cancela o completa turnos
5. crea, edita y desactiva servicios
6. define disponibilidad
7. bloquea horarios especiales
8. revisa clientes
9. edita la pagina publica del negocio

---

## 10. Pantallas MVP

Publicas:

- `/{slug}`
- `/{slug}/reservar`
- `/{slug}/confirmacion`
- `/{slug}/mi-turno`

Admin:

- `/admin/login`
- `/admin/dashboard`
- `/admin/bookings`
- `/admin/services`
- `/admin/availability`
- `/admin/customers`
- `/admin/onboarding`

`/admin/settings` puede existir como alias o redirect, pero no debe duplicar funcionalidad.

---

## 11. Features MVP que si deben entrar

- auth admin
- pagina publica por negocio
- reserva publica
- validacion contra solapamientos
- clientes
- dashboard simple
- estados de turnos
- CRUD de servicios
- gestion de disponibilidad
- bloqueo de franjas horarias
- email de confirmacion
- recordatorio por email
- responsive real

---

## 12. Colecciones base en PocketBase

Colecciones minimas:

- `businesses`
- `users`
- `services`
- `customers`
- `availability_rules`
- `blocked_slots`
- `bookings`
- `communication_events`
- `analytics_events`

Estados de booking:

- `pending`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

---

## 13. Reglas tecnicas clave

- TypeScript estricto
- validacion con Zod
- logica sensible en servidor
- no confiar disponibilidad solo en frontend
- aislar todo por `business_id`
- separar queries, acciones y UI
- evitar codigo duplicado en admin

---

## 14. Roadmap corto

### Sprint 1

- auth admin
- datos demo
- home publica
- reserva publica
- confirmacion

### Sprint 2

- dashboard
- clientes
- links de gestion del turno
- emails base

### Sprint 3

- CRUD de servicios
- gestion de disponibilidad
- bloqueo de franjas
- acciones sobre turnos

### Sprint 4

- pulido visual
- demo comercial
- pricing
- materiales de venta

---

## 15. Estado actual vs plan

### Ya esta

- login admin
- dashboard
- clientes
- pagina publica editable
- flujo de reserva publica
- confirmacion
- reprogramacion y cancelacion por link
- branding y contenido de la pagina
- base de emails y recordatorios
- PocketBase funcionando

### Falta para cumplir el plan original

- editar turnos desde admin
- CRUD real de servicios desde admin
- gestion real de disponibilidad desde admin
- bloqueo de horarios desde admin

### Conclusion real

La app ya sirve como demo avanzada y base operativa, pero **todavia no cumple completo el admin esperado del MVP vendible**.

Para que quede lista para venta, la prioridad tecnica deberia ser:

1. `Servicios` con CRUD real
2. `Disponibilidad` con alta/edicion/bloqueos
3. `Turnos` con acciones operativas

---

## 16. Riesgos

Riesgo principal:

que la demo se vea buena, pero que el negocio no pueda operar solo.

Como evitarlo:

- cerrar CRUD admin antes de sumar mas features
- no abrir mas frentes de infraestructura todavia
- vender una app simple pero realmente usable

---

## 17. Decision operativa actual

Hasta cerrar el primer cliente, la regla es:

- PocketBase se queda
- una sola instancia
- foco total en funcionalidad y venta
- la migracion o cambio de backend se decide despues

---

## 18. Proximo objetivo concreto

**Dejar el admin realmente operable para un negocio chico.**

Eso significa:

- que pueda editar servicios
- que pueda definir horarios
- que pueda bloquear franjas
- que pueda mover estados de turnos

Cuando eso este listo, la app pasa de demo fuerte a producto vendible.
