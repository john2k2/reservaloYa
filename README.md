# ReservaYa

Sistema de turnos online multi-tenant para negocios chicos (barberias, peluquerias y esteticas).

**Demo:** [reservaya-kappa.vercel.app](https://reservaya-kappa.vercel.app)

---

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16, React 19, TypeScript 5 (strict) |
| Estilos | Tailwind CSS v4, shadcn/ui v4 |
| Backend / Auth / DB | PocketBase 0.26.8 |
| Email | Resend (HTML inline, sin dominio requerido) |
| Testing | Vitest, Testing Library, Playwright |
| Deploy | Vercel |

---

## Inicio rapido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abri `http://localhost:3000`. Sin PocketBase configurado, la app corre en **modo local** con datos de demo.

---

## Scripts utiles

```bash
npm run dev              # desarrollo
npm run build            # build productivo
npm run check            # lint + typecheck + test + build (CI completo)
npm run test:coverage    # cobertura
npm run test:e2e         # tests e2e con Playwright
npm run demo:reset       # resetear datos de demo
npm run pb:up            # iniciar PocketBase (Docker)
npm run pb:bootstrap     # seed PocketBase
```

---

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, modelo multi-tenant, modos de operacion y flujos |
| [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) | Estado actual, proximos pasos y criterios de lanzamiento |
| [docs/ops/GO_LIVE_CHECKLIST.md](docs/ops/GO_LIVE_CHECKLIST.md) | Checklist de variables y verificaciones pre-produccion |
| [docs/ops/ENGINEERING_REMEDIATION_TRACKER.md](docs/ops/ENGINEERING_REMEDIATION_TRACKER.md) | Seguimiento de deuda tecnica y mejoras en curso |
| [docs/setup/INTEGRATIONS.md](docs/setup/INTEGRATIONS.md) | Setup de Resend, Twilio, MercadoPago y analytics |
| [docs/setup/THEME_GUIDE.md](docs/setup/THEME_GUIDE.md) | Guia de temas, CSS variables y dark mode |

---

## Estado del proyecto

Ver [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) para el detalle completo.

**Resumen:**
- [x] Flujo publico de reserva completo
- [x] Panel admin funcional (servicios, disponibilidad, turnos, clientes y equipo)
- [x] Onboarding con editor visual de pagina publica
- [x] Emails HTML inline con Resend
- [x] Soporte para pago en efectivo y OAuth de Mercado Pago por negocio
- [x] CI con smoke E2E y coverage thresholds
- [ ] Refactor y hardening tecnico en curso (ver tracker de ingenieria)
