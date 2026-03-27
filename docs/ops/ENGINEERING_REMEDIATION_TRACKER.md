# Engineering Remediation Tracker

Ultima actualizacion: 2026-03-26

## Objetivo

Concentrar en un solo lugar el seguimiento tecnico del proyecto: deuda, reparaciones, refactors, validaciones y criterios de cierre.

---

## Tablero de trabajo

| ID | Frente | Prioridad | Estado | Resultado esperado |
|----|--------|-----------|--------|--------------------|
| ENG-01 | Normalizar textos y encoding | P0 | Hecho | Sin mojibake en UI ni docs criticas |
| ENG-02 | Tests de rutas API criticas | P0 | Hecho | Webhook, callback MP, booking-slots y auth cubiertos |
| ENG-03 | CI con smoke E2E | P1 | Hecho | PRs bloquean regresiones visibles |
| ENG-04 | Thresholds de coverage | P1 | Hecho | La cobertura no puede degradarse silenciosamente |
| ENG-05 | Refactor stores compartidos | P1 | Hecho | 7 modulos domain extraidos |
| ENG-06 | Unificar integracion Mercado Pago | P1 | Hecho | Precio centralizado, preference unificada, webhook con warning |
| ENG-07 | Logging / observabilidad | P1 | Hecho | Todos los archivos migrados al logger comun |
| ENG-08 | Documentacion alineada | P2 | Hecho | Consolidada de 22 a 7 archivos |
| ENG-09 | Higiene del repo | P2 | Hecho | lint, typecheck, build en verde. 0 TODOs/dead code |

---

## Backlog tecnico pendiente

| ID | Titulo | Prioridad | Tipo | Estado verificado |
|----|--------|-----------|------|-------------------|
| RY-014 | Reducir matcher de refresh de sesion | P1 | Perf | Cerrado. Sin middleware.ts; refresh es explicito por pagina. No aplica. |
| RY-015 | Reemplazar `getFullList` por paginacion | P1 | Perf | Cerrado. Todas las llamadas estan acotadas: batch limits (100/max+1), filtros por businessId, o scoped a datos del negocio. OK para MVP. |
| RY-016 | Optimizar agregaciones del panel admin | P1 | Perf | Cerrado. Agregaciones son server-side (no browser). Volumen de datos por negocio es bajo (barberia/salon). OK para MVP. |
| RY-019 | Cobertura tests en flujos criticos | P2 | TechDebt | Cerrado. 42 test files, thresholds 35% en CI (ENG-04). Subir gradualmente post-launch. |
| RY-020 | Extraer capa de dominio comun entre stores | P2 | TechDebt | Cerrado. 7 modulos domain extraidos en ENG-05. Quedan oportunidades menores post-launch. |
| RY-021 | Politica de dependencias runtime seguras | P2 | TechDebt | Cerrado. 0 vulnerabilidades en produccion. 3 en dev-only (picomatch, Next HMR). Updates menores disponibles, nada critico. |

---

## Detalle ENG-06 - Unificar MercadoPago

### Problemas detectados

1. **Precio de suscripcion hardcodeado en 3 archivos**: `create-preference/route.ts`, `subscription/page.tsx`, `subscription/success/page.tsx`
2. **Dos flujos de creacion de preferencia**: server action (bookings) vs API route GET (subscriptions)
3. **Subscriptions usan token global**, bookings usan OAuth per-business
4. **`MP_WEBHOOK_SECRET` no se valida** cuando MP esta habilitado
5. **Webhook distingue tipo por heuristica** (`getBusinessSubscription()`), no por campo explicito

### Resultado

- [x] Precio centralizado en `src/server/payments-domain.ts` (`SUBSCRIPTION_USD_PRICE`, `getSubscriptionArsPrice()`)
- [x] Preferencias unificadas: `createSubscriptionPreference()` usa el mismo SDK que bookings
- [x] Webhook loguea warning cuando `MP_WEBHOOK_SECRET` no esta configurado
- [ ] Subscriptions usan token global (diseño intencional: la plataforma cobra, no el negocio)

---

## Proxima tanda recomendada

### Bloque 1 - hardening gradual (revisado, todo OK para MVP)
- [x] RY-015: getFullList acotado con batch limits y filtros por business
- [x] RY-016: Agregaciones server-side, volumen bajo por negocio
- [x] RY-021: 0 vulnerabilidades en produccion
- [ ] Configurar `MP_WEBHOOK_SECRET` en Vercel Production (manual, pre-launch)

---

## Notas de criterio

- No cerrar un frente solo porque "anda"; debe quedar mantenible.
- No mezclar refactor grande con fix productivo urgente en el mismo commit.
- Cuando algo impacte produccion (pagos, auth, webhook), probar primero local y luego Vercel.
