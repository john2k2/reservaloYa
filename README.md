# ReservaYa

Sistema de turnos online multi-tenant para negocios chicos (barberias, peluquerias, esteticas).

**Demo:** https://reservaya-kappa.vercel.app

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 (strict) |
| Estilos | Tailwind CSS v4, shadcn/ui v4 |
| Backend / Auth / DB | PocketBase 0.36.6 |
| Email | Resend (HTML inline, sin dominio requerido) |
| Testing | Vitest, Testing Library, Playwright |
| Deploy | Vercel |

---

## Inicio rápido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Sin PocketBase configurado, la app corre en **modo local** con datos de demo.

---

## Modos de operación

### Modo local (default)
- Sin PocketBase configurado
- Datos persistidos en `data/local-store.json`
- Seed: `data/local-store.seed.json`
- Reset demo: `npm run demo:reset`

### Modo PocketBase
Variables mínimas en `.env.local`:
```
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

Ver `.env.example` para la lista completa. Las más importantes:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (ej: https://reservaya-kappa.vercel.app) |
| `BOOKING_LINK_SECRET` | Secret para tokens de gestión de reservas (32+ chars) |
| `CRON_SECRET` | Secret para el endpoint de cron jobs |
| `RESEND_API_KEY` | API Key de Resend para emails |
| `RESEND_FROM_EMAIL` | Email del remitente (opcional: si no se configura usa onboarding@resend.dev) |

> **Nota sobre Resend:** No se requiere dominio propio. Sin `RESEND_FROM_EMAIL` configurado,
> los emails se envían desde `onboarding@resend.dev`. Para producción real con entregabilidad
> óptima, configurar un dominio verificado.

---

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing comercial de ReservaYa |
| `/demo-barberia` | Demo pública – barbería |
| `/demo-estetica` | Demo pública – estética |
| `/[slug]/reservar` | Flujo de reserva |
| `/[slug]/confirmacion` | Confirmación de reserva |
| `/[slug]/mi-turno` | Gestión de turno (reprogramar/cancelar) |
| `/admin/login` | Acceso admin |
| `/admin/dashboard` | Panel admin |

---

## Scripts útiles

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

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, modelo multi-tenant, flujos |
| [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) | Estado actual del proyecto |
| [docs/ops/NEXT.md](docs/ops/NEXT.md) | Próximos pasos y roadmap |
| [docs/ops/GO_LIVE_CHECKLIST.md](docs/ops/GO_LIVE_CHECKLIST.md) | Checklist antes de publicar |
| [docs/ops/remediation-backlog.md](docs/ops/remediation-backlog.md) | Backlog de issues conocidos |
| [docs/setup/NOTIFICATIONS_SETUP.md](docs/setup/NOTIFICATIONS_SETUP.md) | Configurar email y WhatsApp |
| [docs/setup/SETUP_EMAILS.md](docs/setup/SETUP_EMAILS.md) | Guía rápida de emails |
| [docs/setup/TRACKING_PLAN.md](docs/setup/TRACKING_PLAN.md) | Plan de analytics |
| [docs/setup/THEME_GUIDE.md](docs/setup/THEME_GUIDE.md) | Guía de temas y colores |

---

## Estado del proyecto

Ver [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) para el detalle completo.

**Resumen:**
- ✅ Flujo público de reserva completo
- ✅ Panel admin completo (CRUD servicios, disponibilidad, turnos, clientes, equipo)
- ✅ Onboarding con editor visual de página pública
- ✅ Emails HTML inline con Resend (sin dominio requerido)
- ✅ Analytics básico del embudo
- ⏳ Recordatorios automáticos (endpoint listo, falta cron en Vercel)
- ⏳ WhatsApp via Twilio (estructura lista, falta credenciales)
- 🔜 Pagos con MercadoPago
- 🔜 Portal de clientes
