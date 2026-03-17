# Plan de remediacion y backlog

## Fases

- Semana 1 (estabilizacion): seguridad critica y superficie publica.
- Semanas 2-4 (hardening): concurrencia, timezone, consistencia funcional y CI.
- Mes 2+ (scaling/refactor): performance estructural, menos duplicacion, mas cobertura.

## Checklist primeras 48h

- [x] Endurecer `BOOKING_LINK_SECRET` fuera de local/demo.
- [x] Mitigar CSV injection en exportaciones.
- [ ] Activar rate limiting en booking/login/analytics.
- [x] Reducir matcher de `proxy` a rutas admin/auth.
- [ ] Ajustar permisos PocketBase a minimo privilegio para flujos publicos.

## Backlog de issues (priorizado)

| ID | Titulo | Prioridad | Tipo | Estimacion |
|---|---|---|---|---|
| RY-001 | Retirar superuser de flujos publicos | P0 | Security | L |
| RY-002 | Endurecer reglas PocketBase por coleccion | P0 | Security | M |
| RY-003 | Mitigar CSV injection en exportaciones admin | P0 | Security | S |
| RY-004 | Rate limiting en creacion/reprogramacion de turnos | P0 | Security | M |
| RY-005 | Rate limiting en login admin | P0 | Security | S |
| RY-006 | Endurecer autenticacion en job de reminders | P0 | Security | S |
| RY-007 | Corregir race condition en creacion de turnos | P0 | Bug | L |
| RY-008 | Corregir race condition en reprogramacion | P0 | Bug | M |
| RY-009 | Eliminar fecha hardcodeada del flujo local | P1 | Bug | S |
| RY-010 | Normalizar timezone en reminders | P1 | Bug | M |
| RY-011 | Corregir fallback enganoso en confirmacion | P1 | Bug | S |
| RY-012 | Unificar validacion de slug local + PocketBase | P1 | Bug | M |
| RY-013 | Reemplazar imports internos `next/dist/*` | P1 | TechDebt | S |
| RY-014 | Reducir matcher de refresh de sesion | P1 | Perf | S |
| RY-015 | Reemplazar `getFullList` por paginacion | P1 | Perf | M |
| RY-016 | Optimizar agregaciones del panel admin | P1 | Perf | M |
| RY-017 | Corregir lint y quality gate local | P1 | DevEx | S |
| RY-018 | CI minima obligatoria (lint, test, build) | P1 | DevEx | M |
| RY-019 | Cobertura tests en flujos criticos | P2 | TechDebt | L |
| RY-020 | Extraer capa de dominio comun entre stores | P2 | TechDebt | L |
| RY-021 | Politica de dependencias runtime seguras | P2 | TechDebt | M |

## Orden sugerido por rol

1. Backend: RY-001, RY-002, RY-003, RY-004, RY-005, RY-006, RY-007, RY-008.
2. DevOps: RY-006, RY-018 y gestion de secretos por entorno.
3. QA: pruebas de regresion de booking, login, reminders y export.
4. Frontend: RY-011, RY-012 y paginacion del panel (RY-016).
