# Tests E2E - ReservaYa

Tests end-to-end con Playwright para validar flujos críticos de la aplicación.

## Estructura

```
e2e/
├── fixtures/           # Datos de prueba reutilizables
│   └── test-data.ts
├── tests/             # Suites de tests
│   ├── public-booking.spec.ts    # Flujo público de reserva
│   ├── admin-panel.spec.ts       # Panel de administración
│   └── booking-management.spec.ts # Gestión de turnos
└── README.md
```

## Instalación

```bash
# Instalar Playwright (ya incluido en devDependencies)
npm install

# Instalar navegadores
npx playwright install chromium
```

## Ejecutar Tests

```bash
# Todos los tests
npx playwright test

# Tests específicos
npx playwright test public-booking
npx playwright test admin-panel
npx playwright test booking-management

# Modo UI (interactivo)
npx playwright test --ui

# Con headed browser (visible)
npx playwright test --headed

# En modo debug
npx playwright test --debug
```

## Tests Coverage

### Flujo Público (`public-booking.spec.ts`)
- ✅ Visualización de página de negocio
- ✅ Navegación al formulario de reserva
- ✅ Selección de servicio
- ✅ Visualización de formulario de datos
- ✅ Validación de campos requeridos
- ✅ SEO: metadatos y JSON-LD
- ✅ Responsive en móvil

### Panel Admin (`admin-panel.spec.ts`)
- ✅ Formulario de login
- ✅ Validación de credenciales
- ✅ Dashboard con métricas
- ✅ Navegación entre secciones
- ✅ Gestión de servicios
- ✅ Configuración de disponibilidad

### Gestión de Turnos (`booking-management.spec.ts`)
- ✅ Listado de turnos
- ✅ Filtros por estado
- ✅ Búsqueda de turnos
- ✅ Cambio de estado
- ✅ Página de confirmación
- ✅ Accesibilidad

## Configuración

Variables de entorno:

```bash
# URL base para tests (default: http://localhost:3000)
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Ejecutar en CI
CI=true
```

## Reportes

Los reportes se generan en:
- HTML: `playwright-report/index.html`
- JSON: `playwright-report/results.json`

```bash
# Mostrar reporte HTML
npx playwright show-report
```

## Mejores Prácticas

1. **Datos de prueba**: Usar `e2e/fixtures/test-data.ts` para mantener consistencia
2. **Selectores**: Priorizar roles y labels sobre clases CSS
3. **Esperas**: Usar `waitForSelector` o `expect.toBeVisible()` en lugar de timeouts fijos
4. **Resiliencia**: Los tests manejan elementos opcionales con `.catch(() => false)`

## Troubleshooting

### Tests fallan por timeout
```bash
# Aumentar timeout global
npx playwright test --timeout=60000
```

### Navegador no inicia
```bash
# Reinstalar navegadores
npx playwright install --force
```

### Tests inconsistentes
```bash
# Ejecutar con retries
npx playwright test --retries=3
```
