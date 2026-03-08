# Project State

## Nombre

ReservaYa

## Enfoque

Producto-servicio para vender turnos online a negocios chicos que hoy operan por WhatsApp.

## Decision tecnica principal

Arquitectura multi-tenant sobre un solo proyecto de Supabase usando `business_id` y RLS, con modo local persistente para demo comercial.

## Estado actual

- Landing comercial funcional
- Flujo publico de reserva funcionando en modo local
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
- Settings ya no duplica branding y queda orientado a ajustes operativos
- Analytics basico del embudo web en modo local
- Dashboard admin con datos reales del store local
- Vistas admin de turnos, clientes, servicios, disponibilidad y ajustes con datos demo
- Responsive audit completo aplicado con estandar mobile-first y targets tactiles >= 44px
- Demo publica de barberia lista
- Demo publica de estetica lista
- Store local multi-negocio funcionando
- `npm run lint` y `npm run build` pasando

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
- Mostrar dos verticales demo distintas sin tocar backend remoto
- Navegar mobile y desktop sin overflow horizontal ni elementos fuera de viewport

## Lo que falta fuera del admin

### 1. Flujo real de reserva

- Estados de reserva mas claros para cliente
- Manejo mas fino de disponibilidad cuando no hay horarios

### 2. Confirmaciones y seguimiento

- Activar envio real con credenciales de Resend
- Conectar el job de recordatorios a ejecucion automatica real
- Mensaje o email post-turno
- Historial de comunicaciones por booking

### 3. Personalizacion por negocio

- Politicas de cancelacion
- Horarios y contenido comercial por negocio

### 4. Onboarding para convertir demo en negocio real

- Paso posterior para pulir copy, redes y assets propios

## Riesgo principal ahora

Que la demo se vea bien, pero que todavia falte el paso operativo que convierte una demo en producto usable por un negocio real.

## Prioridad recomendada

1. Ajustes finos de errores y disponibilidad
2. Seguimiento post-turno
3. SEO/meta por negocio publico
4. Ajustes finos de produccion

## Regla operativa

Cada proximo cambio debe empujar una de estas metas:

- demo mas convincente
- producto mas vendible
- flujo de reserva mas real
