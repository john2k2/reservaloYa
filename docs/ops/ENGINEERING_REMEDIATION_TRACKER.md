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
| ENG-06 | Unificar integracion Mercado Pago | P1 | En curso | Mismo criterio para bookings y subscription |
| ENG-07 | Logging / observabilidad | P1 | Casi listo | 5 archivos pendientes de migrar al logger comun |
| ENG-08 | Documentacion alineada | P2 | Hecho | Consolidada de 22 a 7 archivos |
| ENG-09 | Higiene del repo | P2 | Hecho | lint, typecheck, build en verde. 0 TODOs/dead code |

---

## Backlog tecnico pendiente

| ID | Titulo | Prioridad | Tipo | Estado verificado |
|----|--------|-----------|------|-------------------|
| RY-014 | Reducir matcher de refresh de sesion | P1 | Perf | Sin middleware.ts; refresh es explicito por pagina. Bajo impacto real. |
| RY-015 | Reemplazar `getFullList` por paginacion | P1 | Perf | 4 llamadas en pocketbase-store, booking-slot-lock, rate-limit. No critico al volumen actual. |
| RY-016 | Optimizar agregaciones del panel admin | P1 | Perf | Agregaciones client-side con filter/reduce. Funciona con pocos datos. |
| RY-019 | Cobertura tests en flujos criticos | P2 | TechDebt | 42 test files, thresholds 35% en CI (ENG-04). Subir gradualmente. |
| RY-020 | Extraer capa de dominio comun entre stores | P2 | TechDebt | 7 modulos domain extraidos en ENG-05. Quedan oportunidades menores. |
| RY-021 | Politica de dependencias runtime seguras | P2 | TechDebt | Dependencies en versiones estables. Sin vulnerabilidades criticas hoy. |

---

## Detalle ENG-06 - Unificar MercadoPago

### Problemas detectados

1. **Precio de suscripcion hardcodeado en 3 archivos**: `create-preference/route.ts`, `subscription/page.tsx`, `subscription/success/page.tsx`
2. **Dos flujos de creacion de preferencia**: server action (bookings) vs API route GET (subscriptions)
3. **Subscriptions usan token global**, bookings usan OAuth per-business
4. **`MP_WEBHOOK_SECRET` no se valida** cuando MP esta habilitado
5. **Webhook distingue tipo por heuristica** (`getBusinessSubscription()`), no por campo explicito

### Plan de trabajo

- [ ] Centralizar precio de suscripcion en constante unica
- [ ] Unificar creacion de preferencias en funcion compartida
- [ ] Agregar validacion de `MP_WEBHOOK_SECRET`
- [ ] Evaluar si subscriptions deberian usar token per-business

---

## Proxima tanda recomendada

### Bloque 1 - ENG-06 (MercadoPago)
- [ ] Centralizar precio suscripcion
- [ ] Unificar preference creation
- [ ] Validar MP_WEBHOOK_SECRET

### Bloque 2 - ENG-07 (cerrar)
- [ ] Migrar 5 archivos restantes al logger comun

### Bloque 3 - hardening gradual
- [ ] RY-015: Evaluar paginacion en getFullList
- [ ] RY-016: Evaluar agregaciones server-side en dashboard
- [ ] Configurar `MP_WEBHOOK_SECRET` en Vercel Production

---

## Notas de criterio

- No cerrar un frente solo porque "anda"; debe quedar mantenible.
- No mezclar refactor grande con fix productivo urgente en el mismo commit.
- Cuando algo impacte produccion (pagos, auth, webhook), probar primero local y luego Vercel.
