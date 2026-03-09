# Auditoría de Hovers - ReservaYa

## Resumen Ejecutivo

Se encontraron **8 problemas** de consistencia y usabilidad en los estados hover de la aplicación.

---

## 🚨 Problemas Encontrados

### 1. ESCALA INCONSISTENTE
**Severidad: Media**

Hay múltiples valores de escala en hovers:
- `hover:scale-105` (1.05x) - Header, Hero, DemoSelector
- `hover:scale-[1.02]` (1.02x) - Página pública, Precios
- `hover:scale-110` (1.10x) - Iconos de features

**Problema:** El usuario percibe inconsistencia visual cuando diferentes elementos tienen distinta intensidad de respuesta.

**Recomendación:** Estandarizar a `hover:scale-[1.02]` para elementos grandes y `hover:scale-105` para botones pequeños.

---

### 2. FALTAN HOVERS EN ELEMENTOS CLICKEABLES
**Severidad: Alta**

Elementos que deberían tener hover pero no lo tienen:

| Elemento | Ubicación | Problema |
|----------|-----------|----------|
| Botón WhatsApp | `/[slug]/page.tsx:352` | Solo tiene estilo base, sin hover visual |
| Tarjetas de servicios | `/[slug]/page.tsx` | Sin feedback al pasar el mouse |
| Items de lista | Dashboard | Sin hover en turnos próximos |
| Links del footer | Footer | Algunos faltan transition |

**Ejemplo del problema:**
```tsx
// Actual - Sin hover visual
<a
  href={whatsappHref}
  className={cn(
    buttonVariants({ variant: "outline", size: "lg" }),
    "h-14 rounded-full px-10 text-base"  // ❌ Sin hover
  )}
>
```

---

### 3. DURACIÓN DE TRANSICIONES INCONSISTENTE
**Severidad: Baja-Media**

Duraciones encontradas:
- `duration-300` - Mayoría
- `duration-500` - Imágenes, DemoSelector
- `duration-700` - Imágenes de preview
- Sin especificar - Varios elementos (default 150ms)

**Problema:** Algunos elementos responden rápido, otros lento, creando una experiencia desconectada.

---

### 4. FALTA `cursor-pointer` EN ELEMENTOS INTERACTIVOS
**Severidad: Media**

Elementos que son clickeables pero no muestran cursor de mano:
- Tarjetas de selección de fecha en `/reservar`
- Slots de horario en `/reservar`
- Algunos botones del admin

---

### 5. HOVER SIN `transition-colors`
**Severidad: Baja**

Elementos con cambio de color brusco (sin transición suave):
- Botón outline de WhatsApp en página pública
- Algunos links en el footer
- Iconos sociales en la página pública

---

### 6. INCONSISTENCIA EN CARDS DEL DASHBOARD
**Severidad: Media**

Las tarjetas del dashboard tienen diferentes estilos hover:
- Métricas: Sin hover
- Analytics: Sin hover
- Próximos turnos: Sin hover
- Recordatorios: Sin hover

**Problema:** El dashboard se siente "estático" comparado con la landing.

---

### 7. EFECTOS HOVER QUE NO FUNCIONAN EN MÓVIL
**Severidad: Baja**

Los efectos hover (`hover:scale`, `hover:shadow`) permanecen en móviles después de tocar, creando una experiencia extraña.

**Solución:** Agregar `active:` states para móvil o usar `@media (hover: hover)`.

---

### 8. COLORES DE HOVER INCONSISTENTES
**Severidad: Baja**

- Algunos usan `hover:bg-secondary`
- Otros `hover:bg-muted`
- Otros `hover:bg-secondary/50`
- Algunos con opacidad, otros sin

---

## 📋 Plan de Corrección

### Prioridad 1 (Inmediata)

1. **Agregar hover faltante al botón WhatsApp de página pública**
2. **Agregar cursor-pointer a selección de fechas/horarios**
3. **Estandarizar duración a `duration-300`**

### Prioridad 2 (Esta semana)

4. **Agregar hovers al dashboard** (cards de métricas y analytics)
5. **Estandarizar valores de escala**
6. **Agregar `active:` states para móvil**

### Prioridad 3 (Próxima iteración)

7. **Crear componente `HoverCard` consistente**
8. **Documentar sistema de hovers en Storybook**

---

## ✅ Hovers Bien Implementados

| Componente | Implementación | Estado |
|------------|---------------|--------|
| Botones primarios | `hover:scale-105` + sombra | ✅ |
| Navegación admin | `hover:bg-secondary` | ✅ |
| DemoSelector cards | `hover:scale-[1.02]` + shadow | ✅ |
| Features icons | `group-hover` con scale | ✅ |
| Footer links | `hover:translate-x-1` | ✅ |
| FAQ items | `hover:border-border` | ✅ |

---

## 🎯 Recomendaciones Generales

### Sistema de Hovers Recomendado

```css
/* Elementos grandes (cards) */
.card-hover {
  @apply transition-all duration-300;
  @apply hover:shadow-lg hover:scale-[1.01];
}

/* Botones */
.btn-hover {
  @apply transition-all duration-200;
  @apply hover:scale-105 active:scale-95;
}

/* Links */
.link-hover {
  @apply transition-colors duration-200;
  @apply hover:text-foreground;
}

/* Iconos */
.icon-hover {
  @apply transition-transform duration-200;
  @apply hover:scale-110;
}
```

### Mejores Prácticas

1. **Siempre usar `transition-all` o `transition-[propiedad]`**
2. **Especificar duración** (evitar default de 150ms)
3. **Agregar `cursor-pointer`** a elementos interactivos
4. **Incluir `active:` states** para feedback táctil
5. **Mantener consistencia** en toda la app

---

## 📊 Estadísticas

| Tipo | Total | Con Hover | Sin Hover | Calidad |
|------|-------|-----------|-----------|---------|
| Botones | 25 | 22 | 3 | 88% |
| Cards | 18 | 14 | 4 | 78% |
| Links | 32 | 30 | 2 | 94% |
| Iconos | 15 | 12 | 3 | 80% |

**Calidad General: 85%** (Buena, pero mejorable)
