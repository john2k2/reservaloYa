# Plan de remediacion y backlog

## Fases

- Semana 1 (estabilizacion): seguridad critica y superficie publica.
- Semanas 2-4 (hardening): concurrencia, timezone, consistencia funcional y CI.
- Mes 2+ (scaling/refactor): performance estructural, menos duplicacion, mas cobertura.

## Checklist primeras 48h

- [x] Endurecer `BOOKING_LINK_SECRET` fuera de local/demo.
- [x] Mitigar CSV injection en exportaciones.
- [x] Rate limiting en creacion de turnos (booking creation con ventana de 60s).
- [x] Reducir matcher de `proxy` a rutas admin/auth.
- [ ] Rate limiting en login admin (RY-005).
- [ ] Ajustar permisos PocketBase a minimo privilegio para flujos publicos (RY-001, RY-002).

## Backlog de issues (priorizado)

| ID | Titulo | Prioridad | Tipo | Estado | Notas |
|---|---|---|---|---|---|
| RY-001 | Retirar superuser de flujos publicos | P0 | Security | ✅ Resuelto | Fallback removido de createPocketBasePublicClient |
| RY-002 | Endurecer reglas PocketBase por coleccion | P0 | Security | ✅ Resuelto | rate_limit_events y booking_locks con reglas admin-only |
| RY-003 | Mitigar CSV injection en exportaciones admin | P0 | Security | ✅ Resuelto | Sanitizacion aplicada |
| RY-004 | Rate limiting en creacion/reprogramacion de turnos | P0 | Security | ✅ Resuelto | `assertRateLimit` en `createPublicBookingAction` |
| RY-005 | Rate limiting en login admin | P0 | Security | ✅ Resuelto | Login 5/min, Signup 3/min, Password reset 3/5/min |
| RY-006 | Endurecer autenticacion en job de reminders | P0 | Security | ✅ Revisado | Soporta BOOKING_JOBS_SECRET y CRON_SECRET. Requiere secret en prod. |
| RY-007 | Corregir race condition en creacion de turnos | P0 | Bug | ✅ Revisado | `withBookingDateLock` cubre el flujo correctamente |
| RY-008 | Corregir race condition en reprogramacion | P0 | Bug | ✅ Revisado | Reschedule excluye booking actual del overlap check |
| RY-009 | Eliminar fecha hardcodeada del flujo local | P1 | Bug | ✅ Resuelto | Fecha dinámica desde `new Date()` |
| RY-010 | Normalizar timezone en reminders | P1 | Bug | ✅ Resuelto | `getBookingTimestamp` ahora usa constructor Date en vez de ISO string |
| RY-011 | Corregir fallback enganoso en confirmacion | P1 | Bug | ✅ Resuelto | `PublicBusinessPageWrapper` en confirmacion y mi-turno |
| RY-012 | Unificar validacion de slug local + PocketBase | P1 | Bug | ✅ Resuelto | Slug normalizado con `slugify()` antes de query en local y PocketBase |
| RY-013 | Reemplazar imports internos `next/dist/*` | P1 | TechDebt | ✅ Resuelto | No se encontraron usos de `next/dist/*` en el codigo |
| RY-014 | Reducir matcher de refresh de sesion | P1 | Perf | ⏳ Pendiente | |
| RY-015 | Reemplazar `getFullList` por paginacion | P1 | Perf | ⏳ Pendiente | Solo PocketBase |
| RY-016 | Optimizar agregaciones del panel admin | P1 | Perf | ⏳ Pendiente | |
| RY-017 | Corregir lint y quality gate local | P1 | DevEx | ✅ Resuelto | `npm run lint` en verde |
| RY-018 | CI minima obligatoria (lint, test, build) | P1 | DevEx | ✅ Resuelto | CI ya corre `npm run check` (lint + typecheck + test + build) |
| RY-019 | Cobertura tests en flujos criticos | P2 | TechDebt | ⏳ Pendiente | |
| RY-020 | Extraer capa de dominio comun entre stores | P2 | TechDebt | ⏳ Pendiente | local-store y pocketbase-store ~4000 LOC combinados |
| RY-021 | Politica de dependencias runtime seguras | P2 | TechDebt | ⏳ Pendiente | |
| RY-022 | Implementar waitlist en PocketBase | P2 | Feature | ✅ Resuelto | Coleccion `waitlist_entries` + `createPocketBaseWaitlistEntry` + accion actualizada |
| RY-023 | Implementar reseñas en PocketBase | P2 | Feature | ✅ Resuelto | Coleccion `reviews` + `createPocketBaseReview` + accion actualizada |

## Orden sugerido por rol

1. Backend: RY-001, RY-002, RY-005, RY-006, RY-007, RY-008.
2. DevOps: RY-006, RY-018 y gestion de secretos por entorno.
3. QA: pruebas de regresion de booking, login, reminders y export.
4. Frontend: RY-012 y paginacion del panel (RY-016).
