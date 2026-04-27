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
# Todos los E2E definidos en playwright.config.ts
npm run test:e2e

# Smoke público/manual
npm run test:e2e:smoke

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
PLAYWRIGHT_BASE_URL=https://reservaya.ar npm run test:e2e:smoke
```

En Windows PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://reservaya.ar"; npm run test:e2e:smoke
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

El smoke E2E no corre automáticamente en cada push para evitar ruido y consumo innecesario de GitHub Actions en plan gratuito.

El job `e2e-smoke` queda disponible manualmente desde GitHub Actions mediante `workflow_dispatch`.

## Buenas prácticas

1. Priorizar roles, labels y texto visible sobre selectores frágiles.
2. Evitar `waitForTimeout`; preferir `expect(...).toBeVisible()` o señales de red/DOM.
3. No ejecutar acciones destructivas contra producción sin datos de prueba aislados.
4. Mantener los tests autenticados separados del smoke público.
