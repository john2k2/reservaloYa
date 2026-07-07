# Guía de Temas - ReservaYa

## Estructura de Colores

El proyecto usa **Tailwind CSS v4** con CSS variables para theming. Los colores se definen en `src/app/globals.css`, dentro de `:root` (modo claro) y `.dark` (modo oscuro).

### Variables CSS Principales

| Variable | Modo Claro | Modo Oscuro | Uso |
|----------|-----------|-------------|-----|
| `--background` | `#f8fafc` | `#0f172a` | Fondo de página |
| `--foreground` | `#0f172a` | `#f8fafc` | Texto principal |
| `--card` | `#ffffff` | `#111827` | Fondo de tarjetas |
| `--card-foreground` | `#0f172a` | `#f8fafc` | Texto en tarjetas |
| `--popover` | `#ffffff` | `#111827` | Fondo de popovers/dropdowns |
| `--primary` | `#0D9488` | `#0D9488` | Botones primarios, acentos de marca (teal) |
| `--primary-foreground` | `#f8fafc` | `#0f172a` | Texto en botones primarios |
| `--secondary` | `#f1f5f9` | `#1e293b` | Fondos secundarios |
| `--secondary-foreground` | `#0f172a` | `#f8fafc` | Texto secundario |
| `--muted` | `#f1f5f9` | `#1e293b` | Fondos sutiles |
| `--muted-foreground` | `#64748b` | `#cbd5e1` | Texto deshabilitado/descripción |
| `--accent` | `#f1f5f9` | `#1e293b` | Resaltados sutiles |
| `--accent-foreground` | `#0f172a` | `#f8fafc` | Texto sobre `--accent` |
| `--destructive` | `#ef4444` | `#f87171` | Errores, acciones destructivas |
| `--success` | `#16a34a` | `#4ade80` | Estados de éxito |
| `--success-foreground` | `#ffffff` | `#052e16` | Texto sobre `--success` |
| `--border` | `#cbd5e1` | `#334155` | Bordes |
| `--input` | `#cbd5e1` | `#334155` | Inputs |
| `--ring` | `#14b8a6` | `#14b8a6` | Focus rings |

`--primary` y `--ring` son teal (`#0D9488`/`#14b8a6`) en ambos modos — es el acento de marca de la plataforma, no cambia entre claro/oscuro. El resto de la paleta es slate (`#f8fafc`…`#0f172a`).

Nota: `--warning` **no está definido** en `globals.css` pese a que algún componente lo referencia (ver hallazgo de auditoría relacionado) — si necesitás un estado de advertencia, definilo siguiendo el mismo patrón que `--success` (variable + utilidades manuales en `@layer utilities`, ver más abajo) antes de usarlo.

### Reglas de Uso

#### ✅ Hacer
```tsx
// Usar variables CSS para adaptarse al tema
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border-border">
```

#### ❌ No Hacer
```tsx
// Colores hardcodeados que rompen el tema
<div className="bg-white"> // Siempre blanco, no respeta tema
<div className="bg-gray-100"> // Gris fijo
<div className="text-black"> // Negro fijo
<div className="text-white"> // Blanco fijo sobre un color arbitrario (ver nota de accesibilidad más abajo)
```

**Nota de accesibilidad — CTAs de reserva**: varios componentes del flujo público de booking (`booking-form-with-waitlist.tsx`, `review-form.tsx`, `booking-date-time-picker.tsx`, `booking-steps-header.tsx`) pintan sus CTAs con el color de acento *del negocio* (`accentColor`, arbitrario por-negocio) y `text-white` fijo encima. Si un negocio elige un acento claro, el texto puede quedar sin contraste suficiente — no asumas que `text-white` es siempre seguro sobre un color que no controlás vos.

### Tailwind v4 y `color-mix()`: por qué `--success` tiene utilidades manuales

Tailwind v4 no puede resolver `var()` definidas en `@theme inline` en runtime para generar variantes de opacidad (`bg-success/10`, etc.) de una CSS variable que además cambia de valor con `.dark`. Por eso `--success` se expone como utilidades manuales en `@layer utilities` (`globals.css` ~L400-442) usando `color-mix(in srgb, var(--success) N%, transparent)` en vez de la sintaxis de opacidad estándar de Tailwind. Cualquier variable nueva que necesite variantes de opacidad (ej. un futuro `--warning`) debe seguir el mismo patrón, no asumir que `bg-warning/10` funciona solo con declarar la variable.

### Componentes

#### Botones (buttonVariants)
- `variant="default"`: `bg-primary text-primary-foreground`
- `variant="outline"`: `border-border bg-background`
- `variant="secondary"`: `bg-secondary text-secondary-foreground`
- `variant="ghost"`: Sin fondo, solo hover

#### Hover States
Siempre usar `duration-200` para transiciones suaves:
```tsx
className="transition-all duration-200 hover:scale-105"
```

## Sistema de tema — dos mecanismos paralelos, no uno

La app tiene **dos sistemas de tema independientes**, cada uno con su propia clave de `localStorage` y su propio código. No son intercambiables y no hay que mezclarlos.

### 1. Tema admin/global (`theme-toggle.tsx` + `next-themes`)

- Clave de `localStorage`: **`theme`** (valores: `light` | `dark` | `system`).
- Toggle: `src/components/theme-toggle.tsx`.
- Provider: `src/components/theme-provider.tsx` (wrapper de `next-themes`), montado en `src/app/layout.tsx` envolviendo toda la app con `attribute="class"` y `defaultTheme="light"`.
- Anti-flash: `layout.tsx` inyecta un `<script>` inline en el `<head>` que lee `localStorage.getItem('theme')` y agrega la clase `dark` a `<html>` antes del primer paint, para evitar el flash de contenido sin estilo (FOUC).
- Aplica a: panel de admin, panel de plataforma, y cualquier página que no sea una página pública de negocio.

### 2. Tema de páginas públicas de negocio (`PublicBusinessThemeProvider`)

- Clave de `localStorage`: **`public-theme`** (distinta de `theme`, a propósito — para que visitar la página pública de un negocio no pise la preferencia de tema del admin logueado en la misma máquina/navegador).
- Toggle: `src/components/public-business-theme-toggle.tsx` (componente separado de `theme-toggle.tsx`).
- Provider: `src/components/public-business-theme-provider.tsx`, montado solo en las rutas públicas de negocio (`(public)/[slug]/...`).
- Lógica: al montar, lee `public-theme` de `localStorage` (o `prefers-color-scheme` si no hay preferencia guardada) y aplica/quita la clase `dark` en `<html>` vía `useEffect` — **no** hay anti-flash server-side para este tema todavía (el script inline de `layout.tsx` solo conoce la clave `theme` del admin), así que un visitante con sistema oscuro puede ver un flash de tema claro en el primer paint de una página pública.
- Al desmontar (navegar fuera de una página pública), restaura la clase `dark`/`light` según la preferencia `theme` del admin, para no dejar "pegado" el tema público en el resto de la app.
- El toggle público (`PublicBusinessThemeToggle`) hoy solo se renderiza dentro de `StickyHeader`, que en mobile no monta hasta que el usuario scrollea pasado un umbral — en la práctica, el toggle puede no ser alcanzable en mobile antes de scrollear.

### Modo oscuro por-negocio (`darkModeColors`)

Cada negocio puede definir sus propios colores para modo oscuro (`DarkModeColors`, tipo en `src/constants/public-business-profiles.ts`: `accent`, `accentSoft`, `surfaceTint`, `background`, `foreground`, `card`, `cardForeground`). Cuando el modo oscuro está activo (`isDark`) y el negocio definió `darkModeColors`, `PublicBusinessThemeProvider` sobreescribe esas variables CSS directamente en `document.documentElement.style` (no en `globals.css` — es un override inline por-negocio encima de los valores base de `.dark`). Al desactivar el modo oscuro o desmontar, esas propiedades inline se remueven y la página vuelve a los valores de `.dark` definidos en `globals.css`.

### Testing

Para verificar que todo funciona:
1. Abrir una página pública de negocio en modo claro y en modo oscuro (toggle público).
2. Abrir el panel de admin en modo claro y en modo oscuro (toggle admin) — confirmar que cambiar uno no afecta al otro en la misma sesión de navegador.
3. Si el negocio tiene `darkModeColors` configurado, confirmar que el acento y los fondos en modo oscuro son los del negocio, no los defaults de `globals.css`.
4. Verificar que los textos sean legibles y los botones tengan contraste en ambos temas, especialmente CTAs que usan el `accentColor` del negocio.
