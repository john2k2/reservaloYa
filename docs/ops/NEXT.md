# Next

## Bloque actual

Llevar el MVP desde "demo convincente" a "beta publicable" con despliegue, automatizaciones reales y validacion final.

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

1. Seguir separando la pagina publica principal y onboarding en componentes mas chicos
2. Seguir separando operaciones publicas de bajo privilegio frente a mutaciones sensibles
3. Validar de punta a punta servicios, disponibilidad y turnos
4. Mejorar manejo de errores y estados sin disponibilidad
5. Activar envio real de email con credenciales de Resend
6. Configurar `CRON_SECRET` y cron productivo para recordatorios

## Criterio de cierre de la siguiente iteracion

Un negocio debe poder:

- crear y editar servicios
- definir horarios base
- bloquear franjas especiales
- revisar y mover estados de turnos
- servir lecturas publicas sin depender del superuser
- recibir confirmaciones y recordatorios reales
- usar una URL publica estable para mostrar la demo

## Recordatorio

Actualizar este archivo y `PROJECT_STATE.md` al cerrar cada bloque importante.
