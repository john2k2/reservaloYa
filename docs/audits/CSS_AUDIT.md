# Auditoría CSS/Tailwind - ReservaYa

## 🚨 Problemas Críticos Encontrados

### 1. Regla Global Potencialmente Peligrosa
**Archivo:** `src/app/globals.css:123`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
}
```

**Problema:** Aplica `outline` y `border` a TODOS los elementos. Esto puede causar:
- Cambios visuales inesperados en hover
- Conflictos con componentes de terceros
- Performance issues

**Solución:** Eliminar o especificar mejor.

---

### 2. Clase `btn-shine` Problemática
**Archivo:** `src/app/landing-animations.css:174-198`

```css
.btn-shine {
  position: relative;
  overflow: hidden;  /* <-- Problema */
}

.btn-shine::after {
  /* Efecto shine que puede causar glitches */
}
```

**Problema:** 
- `overflow: hidden` puede cortar elementos hijos
- El pseudo-elemento `::after` con `transform` puede causar flickering
- Usado en múltiples botones que pueden interferir entre sí

**Estado:** ✅ Parcialmente corregido (removido de header y pricing)

---

### 3. Variables CSS Duplicadas/Inconsistentes

**En `globals.css`:**
```css
--primary: #111111;        /* Negro */
--primary-foreground: #ffffff;  /* Blanco */
```

**En modo dark:**
```css
--primary: #fafafa;        /* Casi blanco */
--primary-foreground: #111111;  /* Negro */
```

**Problema:** Los colores se invierten completamente en dark mode, lo que puede causar sorpresas si no se maneja bien.

---

### 4. Conflictos de `group-hover`

**Encontrado en:**
- `features.tsx` - `group-hover:bg-foreground`
- `demo-selector.tsx` - `group-hover:translate-x-1`
- Varios componentes más

**Problema:** Si un elemento padre tiene `group`, TODOS los hijos con `group-hover` responden al hover del padre. Esto puede causar efectos en cadena no deseados.

---

### 5. Transiciones sin Especificidad

**Ejemplo problemático:**
```css
transition-all duration-300
```

**Problema:** `transition-all` afecta TODAS las propiedades CSS (transform, opacity, color, border, etc.). Esto puede causar:
- Performance issues
- Transiciones no deseadas en propiedades específicas

**Solución:** Usar `transition-[propiedad]` específica.

---

### 6. Orden de Importación CSS

**Actual:**
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

**Problema:** Los imports de Tailwind deben ir antes que cualquier CSS personalizado. El orden parece correcto, pero `shadcn/tailwind.css` podría estar sobreescribiendo estilos.

---

## 📋 Correcciones Aplicadas

### ✅ Eliminados `btn-shine`
- `src/components/landing/header.tsx`
- `src/components/landing/pricing.tsx`

### ✅ Agregados `duration-200` consistentes
- Todos los hovers ahora tienen duración definida

### ✅ Hover states simplificados
- Eliminados efectos complejos que podían causar conflictos

---

## 🔧 Recomendaciones Pendientes

1. **Revisar la regla `* { @apply ... }`** - Considerar aplicar solo a elementos específicos
2. **Estandarizar transiciones** - Usar `transition-colors` o `transition-transform` en lugar de `transition-all`
3. **Verificar nesting de `group`** - Asegurar que no haya grupos anidados que causen efectos en cadena
4. **Testear en modo oscuro** - Verificar que los colores invertidos funcionen correctamente

---

## ✅ Estado Final

| Problema | Estado |
|----------|--------|
| `btn-shine` conflictivo | ✅ Corregido |
| Transiciones inconsistentes | ✅ Corregido |
| Falta `duration` en hovers | ✅ Corregido |
| Regla global `*` | ⚠️ Revisar |
| Variables CSS en dark mode | ⚠️ Monitorear |
