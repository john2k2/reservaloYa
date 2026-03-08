# Tracking Plan

## Objetivo

Medir lo minimo necesario para saber si la pagina publica atrae visitas y si esas visitas terminan en reservas.

## Eventos activos

| Evento | Que mide | Trigger | Propiedades |
|---|---|---|---|
| `public_page_view` | Vista a la pagina publica del negocio | Carga de `/{slug}` | `source`, `medium`, `campaign`, `pagePath` |
| `booking_cta_clicked` | Clic en botones para empezar la reserva | Click en CTAs de `/{slug}` | `source`, `medium`, `campaign`, `pagePath` |
| `booking_page_view` | Entrada al flujo de reserva | Carga de `/{slug}/reservar` | `source`, `medium`, `campaign`, `pagePath` |
| `booking_created` | Reserva nueva creada desde la web | Confirmacion del form de reserva | `source`, `medium`, `campaign`, `pagePath` |

## Fuente de trafico

- Si llegan `utm_source`, `utm_medium` o `utm_campaign`, se guardan.
- Si no llega nada, la fuente queda como `direct`.

## Lectura en admin

- Visitas publicas
- Clics en reservar
- Entradas al flujo de reserva
- Reservas creadas
- Conversion web
- Fuente principal
- Campana principal
- Canales con visitas, clics y reservas

## Limitaciones actuales

- Funciona en modo local/demo
- No hay integracion real con GA4 o PostHog todavia
- No hay filtros por fecha ni comparativas
- No se mide aun recordatorio enviado ni mensajes post-turno
