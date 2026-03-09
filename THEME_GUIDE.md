# Guía de Temas - ReservaYa

## Estructura de Colores

El proyecto usa **Tailwind CSS v4** con CSS variables para theming. Los colores se definen en `src/app/globals.css`.

### Variables CSS Principales

| Variable | Modo Claro | Modo Oscuro | Uso |
|----------|-----------|-------------|-----|
| `--background` | `#fafafa` | `#111111` | Fondo de página |
| `--foreground` | `#111111` | `#fafafa` | Texto principal |
| `--card` | `#ffffff` | `#111111` | Fondo de tarjetas |
| `--card-foreground` | `#111111` | `#fafafa` | Texto en tarjetas |
| `--primary` | `#111111` | `#fafafa` | Botones primarios |
| `--primary-foreground` | `#ffffff` | `#111111` | Texto en botones primarios |
| `--secondary` | `#f4f4f5` | `#18181b` | Fondos secundarios |
| `--secondary-foreground` | `#111111` | `#fafafa` | Texto secundario |
| `--muted` | `#f4f4f5` | `#27272a` | Fondos sutiles |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | Texto deshabilitado/descripción |
| `--border` | `#e4e4e7` | `#27272a` | Bordes |
| `--input` | `#e4e4e7` | `#27272a` | Inputs |
| `--ring` | `#111111` | `#fafafa` | Focus rings |

### Reglas de Uso

#### ✅ Hacer
```tsx
// Usar variables CSS para adaptarse al tema
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border-border">

// Para fondos oscuros fijos (ej: CTA), usar colores fijos
<div className="bg-gradient-to-br from-foreground to-gray-800 text-background">
  <button className="bg-white text-gray-900"> // Botón claro sobre fondo oscuro
```

#### ❌ No Hacer
```tsx
// Colores hardcodeados que rompen el tema
<div className="bg-white"> // Siempre blanco, no respeta tema
<div className="bg-gray-100"> // Gris fijo
<div className="text-black"> // Negro fijo
<div className="text-white"> // Blanco fijo (excepto sobre fondos oscuros fijos)
```

### Casos Especiales

1. **CTA Section** (fondo oscuro fijo):
   - Usa `from-foreground via-foreground to-gray-800` (gradiente oscuro)
   - Botón primario: `bg-white text-gray-900` (fijo, para contraste)
   - Botón secundario: `bg-transparent text-background` (adaptable)

2. **Time Calculator** (fondo oscuro fijo):
   - Similar al CTA, usa gradiente oscuro
   - Efectos blur: `bg-background` no `bg-white`

3. **Páginas públicas de negocios**:
   - Usan colores de marca del negocio (`accentColor`)
   - El dark mode puede desactivarse por negocio (futuro)

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

### Dark Mode Toggle

El toggle está en `src/components/theme-toggle.tsx` y usa `next-themes`.

Para que una página respete el tema:
1. No usar colores hardcodeados (`bg-white`, `text-black`)
2. Usar las variables CSS (`bg-background`, `text-foreground`)
3. Asegurar que el `ThemeProvider` envuelva la app (ya configurado en `layout.tsx`)

### Testing

Para verificar que todo funciona:
1. Abrir la página en modo claro
2. Cambiar a modo oscuro con el toggle
3. Verificar que:
   - Los textos sean legibles
   - Los botones tengan contraste
   - Los hover funcionen correctamente
