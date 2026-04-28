# Estrategia de Planes - ReservaYa

## Análisis de Features Actuales

### Core Features (Disponibles ahora):
1. Landing pública del negocio
2. Reserva online con horarios en tiempo real
3. Panel admin con agenda
4. Base de clientes
5. Recordatorios automáticos por email
6. Soporte técnico
7. Múltiples servicios configurables
8. Disponibilidad/horarios configurables
9. Página pública personalizable (colores, logo)
10. Reseñas de clientes
11. Integración con WhatsApp
12. Exportación de datos

### Features potenciales (para planes superiores):
1. Recordatorios por WhatsApp (no solo email)
2. Pagos online integrados (MercadoPago)
3. Múltiples usuarios/staff
4. Reportes y analytics avanzados
5. Marketing automation (cupones, promociones)
6. Integración con Google Calendar
7. App móvil para el negocio
8. Fidelización de clientes (puntos, rewards)
9. Confirmaciones automáticas por SMS
10. Widget para Instagram/Redes sociales

---

## Propuesta de Planes

### Plan "Esencial" - $15 USD/mes
**Para**: Profesionales independientes que recién empiezan

**Incluye**:
- ✅ Landing pública profesional
- ✅ Reserva online 24/7
- ✅ Panel admin básico
- ✅ Hasta 3 servicios
- ✅ Recordatorios por email
- ✅ Soporte por WhatsApp (48hs respuesta)
- ✅ 1 usuario admin

**Límites**:
- 100 reservas/mes
- 1 ubicación
- Sin exportación de datos

---

### Plan "Profesional" - $24 USD/mes ⭐ RECOMENDADO
**Para**: Negocios establecidos que quieren crecer

**Incluye todo lo del Plan Esencial, más**:
- ✅ Servicios ilimitados
- ✅ Recordatorios por WhatsApp + Email
- ✅ Base de clientes completa con historial
- ✅ Reseñas y calificaciones
- ✅ Exportación de datos (Excel/CSV)
- ✅ Soporte prioritario (24hs respuesta)
- ✅ Hasta 3 usuarios/staff
- ✅ 500 reservas/mes
- ✅ Múltiples ubicaciones (hasta 2)
- ✅ Personalización avanzada (colores, logo, dominio propio)

**Bonificación**: 1 mes gratis al pagar anual

---

### Plan "Premium" - $39 USD/mes
**Para**: Cadenas y negocios que necesitan escalar

**Incluye todo lo del Plan Profesional, más**:
- ✅ Pagos online integrados (MercadoPago)
- ✅ Confirmaciones automáticas por SMS
- ✅ Reportes y analytics avanzados
- ✅ Marketing automation (cupones, promociones)
- ✅ Integración con Google Calendar
- ✅ Usuarios ilimitados
- ✅ Reservas ilimitadas
- ✅ Ubicaciones ilimitadas
- ✅ Soporte VIP (4hs respuesta)
- ✅ Onboarding personalizado
- ✅ API access

**Bonificación**: 2 meses gratis al pagar anual + sesión de consultoría

---

## Comparativa Visual

| Feature | Esencial $15 | Profesional $24 | Premium $39 |
|---------|-------------|----------------|-------------|
| Landing pública | ✅ | ✅ | ✅ |
| Reservas online | ✅ | ✅ | ✅ |
| Recordatorios email | ✅ | ✅ | ✅ |
| Servicios | 3 | Ilimitados | Ilimitados |
| Usuarios | 1 | 3 | Ilimitados |
| Reservas/mes | 100 | 500 | Ilimitadas |
| Recordatorios WhatsApp | ❌ | ✅ | ✅ |
| Pagos online | ❌ | ❌ | ✅ |
| Analytics | Básico | Avanzado | Premium |
| Soporte | 48hs | 24hs | 4hs |
| Exportación datos | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ✅ |

---

## Estrategia de Precios

### Psicología de Precios:
- **Esencial $15**: "Menos que 2 cortes de pelo al mes"
- **Profesional $24**: "El precio de 3 cortes, pero te ahorra 10hs semanales"
- **Premium $39**: "Menos que un empleado medio tiempo, pero trabaja 24/7"

### Descuentos:
- **Pago anual**: 2 meses gratis (17% descuento)
- **Referidos**: 1 mes gratis por cada negocio referido
- **Upgrade**: Si suben de plan, el primer mes al precio anterior

### Free Trial:
- **15 días gratis** en cualquier plan
- **No requiere tarjeta** de crédito
- **Setup en 5 minutos**

---

## Implementación Técnica

### Cambios necesarios:
1. Agregar campo `plan` en tabla `business`
2. Agregar campo `plan_expires_at`
3. Crear tabla `plan_limits` (reservas_mes, usuarios, etc.)
4. Middleware para verificar límites
5. UI para upgrade/downgrade
6. Webhook para pagos recurrentes

### Plan de migración:
1. Clientes actuales → Plan Profesional (por 6 meses al precio actual)
2. Nuevos clientes → Empiezan en Esencial o Profesional
3. Después de 6 meses, migrar todos a nueva estructura

---

## Métricas a Trackear

1. **Conversión free → paid** (objetivo: >30%)
2. **Upgrade rate** Esencial → Profesional (objetivo: >20%)
3. **Upgrade rate** Profesional → Premium (objetivo: >10%)
4. **Churn rate** por plan (objetivo: <5%/mes)
5. **LTV** (Lifetime Value) por plan
6. **CAC** (Customer Acquisition Cost) recuperación

---

## Conclusión

**Plan recomendado para empezar**: **Profesional a $24 USD**

**Justificación**:
- Competitivo vs Booksy ($30)
- Más valor que entry-level ($10-15)
- Margen saludable para crecer
- Fácil justificar con ROI (ahorro de tiempo)

**Próximo paso**: Implementar 3 planes y testear conversión durante 3 meses.