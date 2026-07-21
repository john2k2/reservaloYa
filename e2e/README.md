# Tests E2E - ReservaYa

Tests end-to-end con Playwright para validar flujos críticos de la aplicación.

## Estructura actual

```txt
e2e/
├── fixtures/
│   ├── auth.setup.ts             # Login y storage state para tests autenticados
│   └── test-data.ts              # Datos reutilizables
├── tests/
│   ├── smoke-test.spec.ts        # Smoke público/admin sin sesión
│   ├── public-booking.spec.ts    # Flujo público de reserva
│   ├── booking-management.spec.ts
│   ├── admin-panel.spec.ts
│   └── admin-authenticated.spec.ts
└── README.md
```

## Ejecutar tests

```bash
# Smoke público estable (default, canónico)
npm run test:e2e

# Flujo público de reserva (solo lectura, negocio demo-barberia)
npm run test:e2e:booking

# Admin autenticado (requiere sesión/credenciales de prueba)
npm run test:e2e:admin

# Suites manuales no bloqueantes
npm run test:e2e:manual

# Todo Playwright, incluyendo manuales/mobile/firefox
npm run test:e2e:all

# Modo UI
npm run test:e2e:ui

# Browser visible
npm run test:e2e:headed

# Debug
npm run test:e2e:debug
```

## Configuración

Por defecto los tests usan:

```txt
http://localhost:3000
```

Se puede cambiar con:

```bash
PLAYWRIGHT_BASE_URL=https://reservaya.ar npm run test:e2e
```

Cuando `PLAYWRIGHT_BASE_URL` apunta a un host externo, Playwright no levanta el dev server local.

En Windows PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://reservaya.ar"; npm run test:e2e
```

## Reportes y artefactos

La configuración actual escribe outputs en `tmp/`:

```txt
tmp/playwright-report/
tmp/test-results/
```

Mostrar reporte HTML:

```bash
npm run test:e2e:report
```

## CI

Hay dos jobs E2E en `.github/workflows/ci.yml`:

- `e2e-smoke-pr`: corre automáticamente en cada PR. Levanta un Supabase local (CLI + Docker, con el negocio `demo-barberia` seedeado por migraciones) y ejecuta los proyectos `public-smoke` y `public-booking` contra el dev server local.
- `e2e-smoke`: disponible manualmente mediante `workflow_dispatch`. Ejecuta los mismos dos proyectos contra producción (`https://reservaya.ar`).

### Flujo público de reserva (`public-booking`)

`e2e/tests/public-booking.spec.ts` es **solo lectura**: navega las páginas públicas de `demo-barberia`, verifica SEO, responsive, horarios y manejo de errores, pero **nunca envía el formulario de reserva**. Por eso es seguro correrlo contra producción: no crea turnos reales ni dispara emails/WhatsApp.

Lo que **falta** para automatizar la creación de una reserva end-to-end (submit del formulario):

1. Ese test crea un turno real y potencialmente envía email/WhatsApp de confirmación, por lo que **no debe correr contra producción**.
2. Para automatizarlo contra el Supabase local del CI haría falta: seeds completos (servicios, disponibilidad y credenciales admin reproducibles), secrets de desarrollo (`BOOKING_LINK_SECRET`, etc.) y stubs de Resend/Twilio para que no salgan notificaciones reales.
3. Mientras tanto, los specs que envían formularios (`booking-management.spec.ts`, `admin-panel.spec.ts`) quedan en los proyectos `manual-*` para corrida local.

## Buenas prácticas

1. Priorizar roles, labels y texto visible sobre selectores frágiles.
2. Evitar `waitForTimeout`; preferir `expect(...).toBeVisible()` o señales de red/DOM.
3. No ejecutar acciones destructivas contra producción sin datos de prueba aislados.
4. Mantener los tests autenticados separados del smoke público.
