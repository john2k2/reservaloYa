# Checklist de capturas — ReservaYa GTM

Tres capturas obligatorias para LinkedIn, landing social y materiales de venta.

**Assets ya capturados (2026-07-17)** en [`assets/`](./assets/):

| Archivo | Contenido |
|---------|-----------|
| `01-landing.png` | Hero landing |
| `02-demo-barberia.png` | Página pública demo |
| `03-booking-flow.png` | Flujo reservar (paso 2) |
| `04-confirmacion.png` | Confirmación de reserva |

**Pendiente:** captura de `/admin/dashboard` (requiere login).

**Resolución recomendada:** 1920×1080 (desktop) o 1440×900 (MacBook). Modo claro preferido para consistencia de marca.

---

## 1. Landing principal

| Campo | Valor |
|-------|-------|
| **URL** | https://reservaya.ar |
| **Nombre archivo sugerido** | `01-landing-hero.png` |
| **Qué mostrar** | Hero completo: logo, headline *"Dejá de perder clientes por WhatsApp"*, subtítulo, CTAs "Probar 15 días gratis" y "Ver demos en vivo" |
| **Scroll** | No — solo viewport inicial (above the fold) |
| **Browser** | Chrome/Firefox, zoom 100%, sin barra de bookmarks |
| **Ocultar** | Extensiones, notificaciones del SO, cursor si es posible |

### Checklist

- [ ] URL visible en barra de direcciones (opcional) o crop limpio sin chrome
- [ ] Ticket stub / elemento visual del hero visible a la derecha (desktop)
- [ ] Sin scroll horizontal ni elementos cortados

---

## 2. Demo barbería (página pública del negocio)

| Campo | Valor |
|-------|-------|
| **URL** | https://reservaya.ar/demo-barberia |
| **Nombre archivo sugerido** | `02-demo-barberia-landing.png` |
| **Qué mostrar** | Hero del negocio demo: nombre, servicios destacados, CTA de reserva |
| **Scroll** | Hero + al menos una fila de servicios con precio y duración |
| **Modo** | Claro (default de la demo) |

### Checklist

- [ ] Se ven al menos 2–3 servicios con precio en ARS
- [ ] Botón "Reservar turno" (o equivalente) visible
- [ ] Branding de barbería coherente — no parece la landing genérica de ReservaYa

### Captura bonus (opcional, no cuenta como obligatoria)

| URL | Uso |
|-----|-----|
| https://reservaya.ar/demo-barberia/reservar | Mostrar calendario + selector de hora en carrusel LinkedIn |

---

## 3. Panel admin (dashboard)

| Campo | Valor |
|-------|-------|
| **URL** | https://reservaya.ar/admin/dashboard |
| **Login previo** | **Sí** — https://reservaya.ar/login |
| **Nombre archivo sugerido** | `03-admin-dashboard.png` |
| **Qué mostrar** | Dashboard con KPIs (turnos, ingresos), navegación lateral, agenda reciente |
| **Cuenta** | Usar cuenta de demo o piloto; **difuminar** emails/teléfonos de clientes reales |

### Checklist

- [ ] Sesión iniciada antes de capturar
- [ ] Sidebar visible: Dashboard, Turnos, Servicios, etc.
- [ ] Al menos un KPI con número (aunque sea 0 en cuenta nueva)
- [ ] Datos personales de terceros difuminados si no es cuenta 100 % demo

### Alternativa si el dashboard está vacío

Capturar `/admin/bookings` con un turno de prueba creado desde la demo:

| URL | https://reservaya.ar/admin/bookings |

---

## Configuración técnica común

| Parámetro | Valor |
|-----------|-------|
| Viewport desktop | 1440 × 900 o 1920 × 1080 |
| Viewport mobile (bonus) | 390 × 844 (iPhone 14) — solo si hacés carrusel |
| Tema OS | Claro |
| Idioma browser | Español (Argentina) |
| Cookies | Aceptadas (evitar banner en captura) |

---

## Herramientas

- **Nativo:** Print Screen / Cmd+Shift+4 / Firefox "Captura de pantalla"
- **DevTools:** `Ctrl+Shift+P` → "Capture full size screenshot" (solo si necesitás scroll completo)
- **Blur:** Preview (macOS), GIMP, o Figma para ocultar PII

---

## Entrega

| Destino | Formato |
|---------|---------|
| LinkedIn carrusel | PNG, ≤ 5 MB cada una |
| Video thumbnail | Exportar `01-landing-hero.png` recortado 1200×627 |
| WhatsApp comercial | Enviar las 3 en orden: problema (landing) → solución cliente (demo) → solución dueño (admin) |

---

## Verificación rápida post-captura

1. ¿Se entiende el problema en la primera imagen (WhatsApp / turnos)?
2. ¿La segunda muestra que *el cliente* puede reservar solo?
3. ¿La tercera muestra que *el dueño* tiene control desde un panel?

Si alguna falla, re-grabar antes de publicar.
