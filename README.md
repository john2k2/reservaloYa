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

## Modos de operacion

### Modo local (default)
- Sin PocketBase configurado
- Datos persistidos en `data/local-store.json`
- Seed: `data/local-store.seed.json`
- Reset demo: `npm run demo:reset`

### Modo PocketBase
Variables minimas en `.env.local`:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=
POCKETBASE_ADMIN_PASSWORD=
```

Levantar PocketBase local:

```bash
npm run pb:up          # inicia Docker
npm run pb:bootstrap   # crea colecciones y seed
npm run pb:logs        # ver logs
npm run pb:down        # apagar
```

---

## Variables de entorno

Ver `.env.example` para la lista completa. Las mas importantes:

| Variable | Descripcion |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL publica de la app (ej: https://reservaya-kappa.vercel.app) |
| `BOOKING_LINK_SECRET` | Secret para tokens de gestion de reservas (32+ chars) |
| `CRON_SECRET` | Secret para el endpoint de cron jobs |
| `RESEND_API_KEY` | API key de Resend para emails |
| `RESEND_FROM_EMAIL` | Email del remitente (opcional: si no se configura usa onboarding@resend.dev) |

> **Nota sobre Resend:** no se requiere dominio propio. Sin `RESEND_FROM_EMAIL` configurado,
> los emails se envian desde `onboarding@resend.dev`. Para produccion real con entregabilidad
> optima, conviene configurar un dominio verificado.

---

## Rutas principales

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing comercial de ReservaYa |
| `/demo-barberia` | Demo publica de barberia |
| `/demo-estetica` | Demo publica de estetica |
| `/[slug]/reservar` | Flujo de reserva |
| `/[slug]/confirmacion` | Confirmacion de reserva |
| `/[slug]/mi-turno` | Gestion de turno (reprogramar/cancelar) |
| `/admin/login` | Acceso admin |
| `/admin/dashboard` | Panel admin |

---

## Scripts utiles

```bash
npm run dev              # desarrollo
npm run build            # build productivo
npm run test             # tests unitarios
npm run test:coverage    # cobertura
npm run test:e2e         # tests e2e con Playwright
npm run demo:reset       # resetear datos de demo
npm run notifications:test -- --dry-run   # probar emails sin enviar
npm run pb:bootstrap     # seed PocketBase
```

---

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, modelo multi-tenant y flujos |
| [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) | Estado actual del proyecto |
| [docs/ops/NEXT.md](docs/ops/NEXT.md) | Proximos pasos y roadmap |
| [docs/ops/GO_LIVE_CHECKLIST.md](docs/ops/GO_LIVE_CHECKLIST.md) | Checklist antes de publicar |
| [docs/ops/remediation-backlog.md](docs/ops/remediation-backlog.md) | Backlog historico de issues conocidos |
| [docs/ops/ENGINEERING_REMEDIATION_TRACKER.md](docs/ops/ENGINEERING_REMEDIATION_TRACKER.md) | Seguimiento activo de mejoras y reparaciones |
| [docs/setup/NOTIFICATIONS_SETUP.md](docs/setup/NOTIFICATIONS_SETUP.md) | Configurar email y WhatsApp |
| [docs/setup/SETUP_EMAILS.md](docs/setup/SETUP_EMAILS.md) | Guia rapida de emails |
| [docs/setup/TRACKING_PLAN.md](docs/setup/TRACKING_PLAN.md) | Plan de analytics |
| [docs/setup/THEME_GUIDE.md](docs/setup/THEME_GUIDE.md) | Guia de temas y colores |

---

## Estado del proyecto

Ver [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) para el detalle completo.

**Resumen corto:**
- [x] Flujo publico de reserva completo
- [x] Panel admin funcional (servicios, disponibilidad, turnos, clientes y equipo)
- [x] Onboarding con editor visual de pagina publica
- [x] Emails HTML inline con Resend
- [x] Soporte para pago en efectivo y base de OAuth de Mercado Pago por negocio
- [x] Recordatorios automaticos (endpoint listo, falta cron en Vercel)
- [x] Validacion end-to-end del cobro online con una cuenta real conectada
- [ ] Refactor y hardening tecnico en curso (ver tracker de ingenieria)
