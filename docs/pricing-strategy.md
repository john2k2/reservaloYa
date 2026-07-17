# Estrategia de Pricing - ReservaYa

## Plan actual (implementado)

**Plan único** — `SUBSCRIPTION_USD_PRICE` en `src/server/payments-domain.ts` ($22 USD/mes).

**Canales de cobro de plataforma** (en este orden operativo):

1. **Transferencia ARS** — datos en `BILLING_TRANSFER_*`; activación manual desde panel platform (“Marcar pagado”).
2. **Polar (tarjeta / USD)** — checkout + webhooks en `/api/payments/polar/*`; renovación automática.
3. **MercadoPago de plataforma** — legacy; solo se muestra si `MP_ACCESS_TOKEN` está configurado. No es el camino primario (cuenta de cobro de plataforma no disponible).

El equivalente en ARS de la landing usa el dólar blue (`getBlueDollarRate`) como referencia para transferencias.

**Incluye**:
- Landing pública profesional del negocio
- Reserva online con horarios en tiempo real
- Panel admin con agenda y clientes
- Recordatorios automáticos por email
- Soporte técnico incluido

**Trial**: 15 días gratis, sin tarjeta de crédito, sin permanencia — cancelás cuando quieras.

## Historial

Este documento proponía originalmente una migración a 3 planes escalonados (Esencial $15,
Profesional $24, Premium $39) con límites por reservas/usuarios/ubicaciones. Esa migración nunca
se implementó: el modelo que corre en producción es un plan único a $22 USD/mes, y no hay campo
`plan` en `business` ni tabla `plan_limits`. Si en el futuro se retoma la segmentación en niveles,
hay que partir de este plan único como base y no de la propuesta de 3 planes de abajo, que quedó
descartada.

### Psicología de precio (vigente para el plan único)

"Menos que 2 cortes de pelo al mes" — comparación usada para justificar el precio frente al ahorro
de tiempo que da automatizar reservas y recordatorios.

### Ideas de features para una futura expansión (no comprometidas a un roadmap)

- Recordatorios por WhatsApp (no solo email)
- Pagos online integrados (MercadoPago OAuth por negocio — ya existe para turnos)
- Múltiples usuarios/staff
- Reportes y analytics avanzados
- Marketing automation (cupones, promociones)
- Integración con Google Calendar
- App móvil para el negocio
- Confirmaciones automáticas por SMS
- Widget para Instagram/Redes sociales
