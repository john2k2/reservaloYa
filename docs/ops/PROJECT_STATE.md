# Project State

## Nombre

ReservaYa

## Enfoque

Producto-servicio para vender turnos online a negocios chicos que hoy operan por WhatsApp.

## Decision tecnica principal

Arquitectura multi-tenant sobre PocketBase self-hosted, con modo local persistente como fallback para demo comercial.

## Estado actual

- Landing comercial funcional
- Flujo publico de reserva funcionando en modo local y PocketBase
- Selector visible de fecha en el flujo publico
- Confirmacion con link a calendario y gestion del turno
- Reprogramacion y cancelacion desde link para cliente
- Confirmacion por email lista para activarse con Resend
- Base de recordatorios automaticos lista en modo local/demo
- Paginas publicas mas comerciales y personalizadas por vertical
- Onboarding simple para clonar una demo y crear un negocio nuevo sin tocar codigo
- Onboarding ahora es el punto unico para construir la identidad de la pagina publica
- Branding profundo editable por negocio (logo, hero, galeria, mapa y redes)
- Subida local de logo/hero sin depender de URL
- Paleta visual guiada por presets en onboarding para evitar inputs tecnicos
- `settings` ya no duplica branding y redirige al editor unico
- Analytics basico del embudo web en modo local
- Dashboard admin con datos reales desde store local o PocketBase
- Vistas admin de turnos, clientes, servicios y disponibilidad ya leen datos reales
- CRUD real de servicios ya operativo
- Gestion real de disponibilidad y bloqueos ya operativa
- Edicion operativa de turnos desde admin ya disponible
- Auth admin, reservas, analytics y recordatorios conectados a PocketBase cuando el backend esta configurado
- Lecturas publicas endurecidas con credenciales PocketBase dedicadas y rules de solo lectura para datos publicos
- Rate limit compartido soportado por PocketBase para login, reservas y analytics cuando el backend esta configurado
- PocketBase bootstrapeable con Docker y colecciones base ya definidas
- Correccion aplicada al esquema base de PocketBase para evitar fallos de update en colecciones demo
- Responsive audit completo aplicado con estandar mobile-first y targets tactiles >= 44px
- Endpoint de jobs de recordatorios listo para uso manual y Vercel Cron
- Demo publica de barberia lista
- Demo publica de estetica lista
- Store local multi-negocio funcionando
- Interfaz de reserva rediseñada: fecha y hora unificados en una sola seccion, horarios agrupados por franja (Manana/Tarde/Noche), selector de fecha premium con sombras dinamicas
- `npm run lint`, `npm run build` y `npm run test -- --run` pasando

## Ya validado

- Crear reserva local desde demo publica
- Ver la confirmacion del turno
- Reprogramar un turno desde su link publico
- Cancelar un turno desde su link publico
- Ver impacto del turno en el panel demo
- Ver visitas, clics, entradas al flujo y reservas por canal en modo local
- Editar branding profundo en settings y ver el cambio reflejado en la pagina publica
- Detectar recordatorios pendientes en una ventana de 24 hs y procesarlos en demo
- Navegar el panel admin completo sin errores de compilacion
- Validar login y flujos base contra PocketBase en `localhost:3000`
- Mostrar dos verticales demo distintas sin tocar backend remoto
- Navegar mobile y desktop sin overflow horizontal ni elementos fuera de viewport

## Lo que falta fuera del admin

### 1. Flujo real de reserva

- Estados de reserva mas claros para cliente
- Manejo mas fino de disponibilidad cuando no hay horarios

### 2. Confirmaciones y seguimiento

- Activar envio real con credenciales de Resend
- Configurar `CRON_SECRET` y despliegue para que el job de recordatorios corra en produccion
- Mensaje o email post-turno
- Historial de comunicaciones por booking

### 2.5. Seguridad y operacion

- Completar rules least-privilege para mas operaciones publicas en PocketBase
- Backups y monitoreo del backend productivo
- Verificar monitoreo y alertas basicas del backend productivo

### 3. Personalizacion por negocio

- Politicas de cancelacion
- Horarios y contenido comercial por negocio

### 4. Onboarding para convertir demo en negocio real

- Paso posterior para pulir copy, redes y assets propios

## Lo que falta dentro del admin

### 1. Turnos

- Validar flujo completo en demo y en backend real
- Mejorar acciones rapidas para operacion diaria

### 2. Servicios

- Validar casos borde y experiencia final

### 3. Disponibilidad

- Validar casos borde y experiencia final

## Riesgo principal ahora

Que el producto ya haga mucho, pero siga pareciendo menos maduro de lo que realmente es por falta de despliegue, automatizacion real y narrativa de lanzamiento.

## Prioridad recomendada

1. Despliegue publico estable
2. Activar Resend y cron real de recordatorios
3. Validacion end-to-end de servicios, disponibilidad y turnos
4. Seguimiento post-turno
5. SEO/meta por negocio publico
6. Backups, monitoreo y despliegue productivo de PocketBase

## Regla operativa

Cada proximo cambio debe empujar una de estas metas:

- demo mas convincente
- producto mas vendible
- flujo de reserva mas real
- admin mas operable
