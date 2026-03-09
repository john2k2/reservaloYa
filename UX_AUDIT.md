# Auditoría UX - ReservaYa

## Resumen Ejecutivo

Se identificaron **12 problemas críticos** de experiencia de usuario que afectan la coherencia, usabilidad y profesionalismo del producto.

---

## 🚨 Problemas Críticos

### 1. INCONSISTENCIA DE LENGUAJE (Tono de voz)
**Severidad: Alta**

El producto mezcla "voseo" (argentino) con "tutear" (español neutro) arbitrariamente:

| Ubicación | Texto actual | Problema |
|-----------|--------------|----------|
| `/reservar` | "Elegi el dia" | Voseo |
| `/reservar` | "Selecciona un servicio" | Tutear |
| `/reservar` | "A que hora?" | Sin tildes ni apertura |
| `/reservar` | "Tenes dudas?" | Voseo |
| Dashboard | "Proximos turnos" | Sin tilde |
| Dashboard | "Accesos utiles" | Sin tilde |

**Recomendación:** Estandarizar a español neutro profesional (tutear) para mercado latinoamericano amplio.

---

### 2. PROBLEMAS DE CODIFICACIÓN (Encoding)
**Severidad: Alta**

El archivo `onboarding-client.tsx` tiene problemas de encoding:
- "MÃ­nimo" en lugar de "Mínimo"
- "MÃ¡ximo" en lugar de "Máximo"
- "invÃ¡lido" en lugar de "inválido"
- "ediciÃ³n" en lugar de "edición"

**Impacto:** El producto se ve amateur y poco confiable.

---

### 3. TÉRMINOS TÉCNICOS EXPUESTOS
**Severidad: Media-Alta**

El usuario ve términos que solo desarrolladores entienden:

- **"Onboarding"** en la navegación → Debería ser "Personalizar" o "Configuración"
- **"Demo Mode"** junto a "Modo real" → Inconsistente
- **"Embudo web"** → "Conversión de visitas" sería más claro
- **"Canales"** → "De dónde vienen tus clientes"

---

### 4. INCONSISTENCIA VISUAL - Bordes y Formas
**Severidad: Media**

Hay 3 sistemas de bordes diferentes:
- `rounded-md` (6px) - Login, algunos botones
- `rounded-lg` (8px) - Tarjetas del dashboard
- `rounded-xl` (12px) - Formularios de reserva
- `rounded-2xl` (16px) - Cards grandes
- `rounded-full` - Botones circulares

**Problema:** No hay un sistema coherente. El usuario percibe inconsistencia visual.

---

### 5. BOTONES SIN ESTADOS DE CARGA
**Severidad: Media**

Algunos botones no tienen loading state:
- Login: El botón "Iniciar sesión" no muestra carga
- Dashboard: "Procesar recordatorios demo" no tiene feedback

Esto genera ansiedad: ¿Se hizo clic? ¿Está procesando?

---

### 6. MENÚ MÓVIL POCO EFICIENTE
**Severidad: Media**

En mobile, el menú ocupa mucho espacio vertical fijo, reduciendo el área de contenido visible.

---

### 7. MENSAJES DE ERROR GENÉRICOS
**Severidad: Media**

Mensajes poco amigables:
- "El link puede haber expirado o ser invalido."
- "No pudimos abrir tu turno"

Falta empatía y soluciones: "El enlace expiró por seguridad. [Volver a solicitar]"

---

### 8. INCONSISTENCIA EN ICONOS
**Severidad: Baja-Media**

- Algunos botones tienen icono + texto, otros solo texto
- Algunos iconos usan `aria-hidden`, otros no
- WhatsAppIcon es un SVG inline duplicado en múltiples archivos

---

### 9. COPY SIN PERSONALIDAD
**Severidad: Baja-Media**

El copy es funcional pero frío. Ejemplos:
- "Resumen operativo del negocio" → "Todo lo que necesitas saber de tu negocio"
- "Señales" → "Alertas importantes"
- "Canales" → "De dónde vienen tus clientes"

---

### 10. VALIDACIONES PÓSTUMAS
**Severidad: Media**

Las validaciones ocurren solo al enviar el formulario, no en tiempo real mientras el usuario escribe.

---

### 11. FALTA DE ESTADOS VACÍOS AMIGABLES
**Severidad: Baja**

Cuando no hay datos:
- "Aún no hay canales con datos suficientes para comparar." (neutral)
- Podría ser: "Cuando tengas visitas, verás de dónde vienen tus clientes. [Ver cómo promocionar]"

---

### 12. INCONSISTENCIA EN COLORES DE ESTADO
**Severidad: Baja**

- Éxito: A veces verde, a veces color de acento
- Error: Destructive (rojo) consistente ✓
- Info: A veces azul, a veces gris

---

## 📝 Plan de Corrección

### Prioridad 1 (Inmediata)
1. ✅ Corregir encoding en `onboarding-client.tsx`
2. ✅ Estandarizar lenguaje a español neutro
3. ✅ Renombrar "Onboarding" → "Personalización"

### Prioridad 2 (Esta semana)
4. Sistema coherente de bordes
5. Loading states en todos los botones de acción
6. Mejorar mensajes de error con empatía

### Prioridad 3 (Próxima iteración)
7. Validaciones en tiempo real
8. Estados vacíos con CTA
9. Warm-up del copy
