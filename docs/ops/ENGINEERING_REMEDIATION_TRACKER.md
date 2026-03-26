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
| ENG-05 | Refactor stores compartidos | P1 | Hecho | Menos duplicacion entre local y PocketBase |
| ENG-06 | Unificar integracion Mercado Pago | P1 | En curso | Mismo criterio para bookings y subscription |
| ENG-07 | Logging / observabilidad | P1 | En curso | Logger consistente + secretos/config completos |
| ENG-08 | Documentacion alineada | P2 | En curso | README y docs criticas sincronizadas con el codigo |
| ENG-09 | Higiene del repo | P2 | En curso | Warnings basicos y drift innecesario resueltos |

---

## Backlog tecnico pendiente

Issues del backlog original que siguen abiertos:

| ID | Titulo | Prioridad | Tipo |
|----|--------|-----------|------|
| RY-014 | Reducir matcher de refresh de sesion | P1 | Perf |
| RY-015 | Reemplazar `getFullList` por paginacion | P1 | Perf (solo PocketBase) |
| RY-016 | Optimizar agregaciones del panel admin | P1 | Perf |
| RY-019 | Cobertura tests en flujos criticos | P2 | TechDebt |
| RY-020 | Extraer capa de dominio comun entre stores | P2 | TechDebt |
| RY-021 | Politica de dependencias runtime seguras | P2 | TechDebt |

---

## Proxima tanda recomendada

### Bloque 1 - impacto alto / riesgo bajo
- [ ] Configurar `MP_WEBHOOK_SECRET` en Vercel Production

### Bloque 2 - hardening
- [ ] Seguir extrayendo helpers compartidos fuera de `local-store` y `pocketbase-store`
- [ ] Empezar ENG-06 unificando el criterio de Mercado Pago entre bookings y subscription
- [ ] Seguir migrando `console.*` al logger comun

---

## Criterios de cierre por frente

### ENG-01 - Textos y encoding
- Sin artefactos tipo `A`, `a`, `ðŸ`, `�` mal decodificados en pantallas visibles
- README y docs operativas legibles
- Nuevos archivos guardados consistentemente en UTF-8

### ENG-02 - Tests API criticos
- Cada ruta critica con test feliz + test de error
- Webhook cubre payload valido, invalido y token faltante
- Callback MP cubre state invalido y success path

### ENG-03 - CI con smoke E2E
- Job adicional en CI con Firefox
- Corre al menos login/admin/public booking smoke
- Falla el PR si rompe UX principal

### ENG-04 - Coverage thresholds
- Minimos: 35% statements/functions/lines, 20% branches
- Se pueden subir por etapas
- El objetivo no es "100%", sino evitar regresion silenciosa

### ENG-05 - Refactor stores
- Extraer dominio compartido antes de mover persistencia
- Reducir duplicacion en bookings, customers, payments y availability
- Modulos extraidos: `payments-domain`, `bookings-domain`, `admin-views-domain`, `admin-dashboard-domain`, `booking-mutations-domain`

---

## Notas de criterio

- No cerrar un frente solo porque "anda"; debe quedar mantenible.
- No mezclar refactor grande con fix productivo urgente en el mismo commit.
- Cuando algo impacte produccion (pagos, auth, webhook), probar primero local y luego Vercel.
