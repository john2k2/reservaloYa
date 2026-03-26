# Engineering Remediation Tracker

Ultima actualizacion: 2026-03-26

## Objetivo

Concentrar en un solo lugar el seguimiento tecnico del proyecto: deuda, reparaciones, refactors, validaciones y criterios de cierre.

> Este archivo reemplaza el seguimiento disperso entre notas sueltas. El backlog historico sigue en `docs/ops/remediation-backlog.md`, pero este documento es el tablero operativo vivo.

---

## Estado base del proyecto

### Lo ya validado
- Produccion estable en [reservaya-kappa.vercel.app](https://reservaya-kappa.vercel.app)
- Reserva publica funcionando
- Fallback a pago en efectivo funcionando
- OAuth de Mercado Pago por negocio implementado a nivel de codigo
- Inicio del flujo de conexion a Mercado Pago funcionando desde onboarding

### Riesgos abiertos principales
1. Cobertura baja en backend critico
2. Duplicacion grande entre `local-store` y `pocketbase-store`
3. Mojibake / textos con encoding roto en varias pantallas y docs
4. CI sin Playwright
5. Rutas API sensibles sin tests dedicados
6. Observabilidad todavia muy basica

---

## Tablero de trabajo

| ID | Frente | Prioridad | Estado | Resultado esperado |
|----|--------|-----------|--------|--------------------|
| ENG-01 | Normalizar textos y encoding | P0 | Hecho | Sin mojibake en UI ni docs criticas |
| ENG-02 | Tests de rutas API criticas | P0 | Hecho | Webhook, callback MP, booking-slots y auth cubiertos |
| ENG-03 | CI con smoke E2E | P1 | Hecho | PRs bloquean regresiones visibles |
| ENG-04 | Thresholds de coverage | P1 | Hecho | La cobertura no puede degradarse silenciosamente |
| ENG-05 | Refactor stores compartidos | P1 | En curso | Menos duplicacion entre local y PocketBase |
| ENG-06 | Unificar integracion Mercado Pago | P1 | En curso | Mismo criterio para bookings y subscription |
| ENG-07 | Logging / observabilidad | P1 | En curso | Logger consistente + secretos/config completos |
| ENG-08 | Documentacion alineada | P2 | En curso | README y docs criticas sincronizadas con el codigo |
| ENG-09 | Higiene del repo | P2 | En curso | Warnings basicos y drift innecesario resueltos |

---

## Trabajo realizado hoy

### 2026-03-25
- [x] Se creo este tracker para centralizar seguimiento tecnico.
- [x] Se limpio el `README.md`:
  - encoding corregido
  - version de PocketBase alineada con `package.json`
  - link al nuevo tracker agregado
- [x] Se empezo la normalizacion de copy visible en `src/app/login/page.tsx`.
- [x] Se eliminaron warnings de lint triviales en scripts y login.
- [x] Se agregaron tests de rutas API para `booking-slots`, `auth/session`, callback OAuth y webhook de Mercado Pago.
- [x] Se definieron thresholds minimos de coverage en Vitest.
- [x] Se agrego job de smoke E2E en GitHub Actions.
- [x] Se mejoro `api/payments/create-preference` para usar token normalizado, redirigir a `/admin/login` y tener tests dedicados.
- [x] Se extrajo `src/server/payments-domain.ts` para compartir mapeo de settings de pago y patches de actualizacion entre `local-store` y `pocketbase-store`.
- [x] Se extrajo `src/server/bookings-domain.ts` para compartir el armado de vistas de confirmacion y gestion de turnos entre `local-store` y `pocketbase-store`.
- [x] Se normalizo copy visible en `src/app/(public)/[slug]/mi-turno/page.tsx` para evitar mojibake en la pagina publica de gestion.
- [x] Se creo `src/server/logger.ts` como logger comun incremental, con `info` silenciado en tests para bajar ruido de CI.
- [x] Se migraron `api/payments/webhook`, `api/auth/mercadopago/callback`, `api/payments/create-preference`, `server/actions/public-booking`, `server/booking-notifications` y `server/mercadopago` al logger comun.
- [x] Se endurecio ENG-02 con casos adicionales para webhook, callback OAuth y auth/session, cubriendo errores de credenciales, payloads invalidos, referencias faltantes y fallbacks de sesion.

### 2026-03-26
- [x] Se reescribio `e2e/tests/smoke-test.spec.ts` para que el smoke cubra de forma mas realista homepage, demo publica, reserva, login/admin shell, onboarding, bookings, services, availability y 404.
- [x] Se cambio el proyecto `ci-smoke` de Playwright a Firefox porque Chrome/Chromium fallaba localmente con un error del runtime ICU en Windows.
- [x] El smoke local `npm run test:e2e:smoke` quedo pasando con 10/10 tests.
- [x] Se actualizo `.github/workflows/ci.yml` para instalar Firefox, alineando CI con el navegador real del smoke.
- [x] Se valido el workflow real en GitHub Actions para la rama `codex/eng-03-ci-smoke`, cerrando ENG-03 con evidencia de ejecucion remota en verde.
- [x] Se revalido `npm run test:coverage` localmente con thresholds en verde y se agrego un job `coverage-thresholds` en GitHub Actions para que la cobertura minima falle en remoto si se degrada.
- [x] Se valido en GitHub Actions real el workflow con el job `coverage-thresholds` en verde para la rama `codex/eng-03-ci-smoke`, cerrando ENG-04.
- [x] Se extrajo `src/server/admin-views-domain.ts` para compartir entre `local-store` y `pocketbase-store` las proyecciones admin de bookings, customers, services, availability y settings, con tests dedicados en `src/server/admin-views-domain.test.ts`.
- [x] Se extrajo `src/server/admin-dashboard-domain.ts` para compartir entre `local-store` y `pocketbase-store` la proyeccion de admin shell, preview de bookings, metricas y notificaciones del dashboard, con tests dedicados en `src/server/admin-dashboard-domain.test.ts`.
- [x] Se reforzo `src/server/payments-domain.ts` con helpers compartidos para normalizar `collectorId` y construir patches de persistencia / limpieza de tokens Mercado Pago por negocio, reutilizados por `local-store` y `pocketbase-store`.

---

## Proxima tanda recomendada

### Bloque 1 - impacto alto / riesgo bajo
- [ ] Configurar `MP_WEBHOOK_SECRET` en Vercel Production

### Bloque 2 - hardening
- [ ] Seguir extrayendo helpers compartidos de bookings, customers y availability fuera de `local-store` y `pocketbase-store`
- [ ] Seguir extrayendo slices compartidas del dashboard/admin shell o persistencia de Mercado Pago para acercar el cierre de ENG-05
- [ ] Extraer la persistencia / helpers de Mercado Pago por negocio entre `local-store` y `pocketbase-store`
- [ ] Seguir migrando `console.*` de callbacks, notificaciones y pagos al logger comun

---

## Criterios de cierre por frente

### ENG-01 - Textos y encoding
- Sin artefactos tipo `Ã`, `â`, `ðŸ`, `�` mal decodificados en pantallas visibles
- README y docs operativas legibles
- Nuevos archivos guardados consistentemente en UTF-8

### ENG-02 - Tests API criticos
- Cada ruta critica con test feliz + test de error
- Webhook cubre payload valido, invalido y token faltante
- Callback MP cubre state invalido y success path

### ENG-03 - CI con smoke E2E
- Workflow separado o job adicional
- Corre al menos login/admin/public booking smoke
- Falla el PR si rompe UX principal

### ENG-04 - Coverage thresholds
- Minimos iniciales realistas
- Se pueden subir por etapas
- El objetivo no es “100%”, sino evitar regresion silenciosa

### ENG-05 - Refactor stores
- Extraer dominio compartido antes de mover persistencia
- Reducir duplicacion en bookings, customers, payments y availability
- Evitar cambio masivo sin tests previos

---

## Comandos de verificacion

```bash
npm run lint
npm run check
npm run test:coverage
npm run test:e2e
```

---

## Notas de criterio

- No cerrar un frente solo porque “anda”; debe quedar mantenible.
- No mezclar refactor grande con fix productivo urgente en el mismo commit.
- Cuando algo impacte produccion (pagos, auth, webhook), probar primero local y luego Vercel.

