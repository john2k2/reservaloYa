# Next

## Bloque actual

Cerrar los pendientes funcionales del admin para que la demo pase a ser un producto que un negocio pueda usar en serio.

## Ultimo avance (2026-03-08)

- Skill `frontend-responsive-ui` instalada y aplicada
- Responsive revalidado en mobile y desktop sin overflow ni desbordes
- Targets tactiles ajustados a 44px+ en flujos publicos y admin
- Onboarding convertido en punto unico para construir la pagina publica
- Upload local de logo, portada y hasta 3 fotos guiadas desde onboarding
- Settings simplificado para no duplicar branding y redirigir al editor unico
- PocketBase estabilizado para updates y listados base
- `npm run lint`, `npm run build` y `npm run test -- --run` pasando

## Siguientes tareas

1. Implementar CRUD real de servicios
2. Implementar gestion real de disponibilidad
3. Implementar acciones operativas sobre turnos
4. Mejorar manejo de errores y estados sin disponibilidad
5. Activar envio real de email con credenciales de Resend
6. Conectar el job real de recordatorios a ejecucion automatica

## Criterio de cierre de la siguiente iteracion

Un negocio debe poder:

- crear y editar servicios
- definir horarios base
- bloquear franjas especiales
- revisar y mover estados de turnos
- seguir teniendo operativo el flujo publico de reserva

## Recordatorio

Actualizar este archivo y `PROJECT_STATE.md` al cerrar cada bloque importante.
