# ReservaYa

Sistema de turnos online multi-tenant para negocios chicos (barberias, peluquerias, esteticas, limp ieza y mas).

**Produccion:** [reservaya.ar](https://reservaya.ar)

---

## Que es este proyecto

ReservaYa es un producto-servicio SaaS que reemplaza la gestion de turnos por WhatsApp en negocios chicos de Argentina. Cada negocio tiene su propia pagina publica con su slug (`reservaya.ar/nombre-del-negocio`), su panel de administracion, y su flujo de reserva completo.

El modelo de negocio es cobrarle una suscripcion mensual a cada negocio que usa la plataforma.

---

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16, React 19, TypeScript 5 (strict) |
| Estilos | Tailwind CSS v4, shadcn/ui v4 |
| Backend / Auth / DB | PocketBase 0.26.8 |
| Email | Resend — desde turnos@reservaya.ar |
| WhatsApp | Twilio (recordatorios, opcional) |
| Pagos | MercadoPago OAuth per-negocio |
| Testing | Vitest, Testing Library, Playwright |
| Deploy | Vercel (app) + Railway (PocketBase) |

---

## Arquitectura — Dual Backend

La app corre en uno de dos modos segun las variables de entorno:

- **Modo local** (default sin config): datos en `data/local-store.json`. Sin dependencias externas. Util para demo comercial y desarrollo.
- **Modo PocketBase**: cuando `NEXT_PUBLIC_POCKETBASE_URL` esta seteado. Auth real, datos reales, multi-tenant completo.

Ambos modos implementan la misma interfaz. Archivos clave:
- `src/server/local-store.ts` — implementacion local
- `src/server/pocketbase-store.ts` — implementacion PocketBase
- `src/server/local-domain.ts` — tipos compartidos y logica de dominio

---

## Infraestructura en produccion

### Vercel — App
- **URL:** https://reservaya.ar
- **Proyecto:** `john2k2s-projects/reservaya`
- **DNS:** delegado a Vercel desde NIC.ar (ns1.vercel-dns.com / ns2.vercel-dns.com)
- **Deploy:** automatico desde rama `main` del repo

### Railway — PocketBase
- **Proyecto Railway:** `dynamic-joy`
- **URL:** https://pocketbase-production-f360.up.railway.app
- **Admin panel:** https://pocketbase-production-f360.up.railway.app/_/
- **Datos:** volumen persistente montado en `/pb_data`
- **Credenciales:** guardadas en Railway vars del proyecto `dynamic-joy`

### Resend — Email
- **Dominio verificado:** reservaya.ar
- **From:** turnos@reservaya.ar
- **DNS records en Vercel:** DKIM (resend._domainkey) + SPF (send MX + send TXT)

### GitHub
- **Repo:** https://github.com/john2k2/reservaloYa
- **Rama main:** produccion
- **Rama stable:** snapshot de backup (actualizar antes de cambios grandes)

---

## Variables de entorno (produccion)

Todas las variables estan en Vercel Dashboard → reservaya → Settings → Environment Variables.

| Variable | Descripcion |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | https://reservaya.ar |
| `NEXT_PUBLIC_POCKETBASE_URL` | URL de la instancia Railway |
| `POCKETBASE_ADMIN_EMAIL` | Superuser de PocketBase |
| `POCKETBASE_ADMIN_PASSWORD` | Password del superuser |
| `POCKETBASE_PUBLIC_AUTH_EMAIL` | Usuario de solo lectura |
| `POCKETBASE_PUBLIC_AUTH_PASSWORD` | Password del usuario de solo lectura |
| `RESEND_API_KEY` | API key de resend.com |
| `RESEND_FROM_EMAIL` | turnos@reservaya.ar |
| `BOOKING_LINK_SECRET` | Secret para tokens HMAC de links firmados |
| `CRON_SECRET` | Secret que Vercel envia al cron automaticamente |
| `MP_APP_ID` | ID de la app de MercadoPago |
| `MP_APP_SECRET` | Secret de la app de MercadoPago |
| `MP_WEBHOOK_SECRET` | Secret para validar firma del webhook de MP |
| `TWILIO_ACCOUNT_SID` | SID de cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de Twilio |
| `TWILIO_WHATSAPP_FROM` | Numero WhatsApp de Twilio |
| `TWILIO_WHATSAPP_TEMPLATE_SID` | SID del template de WhatsApp |
| `PLATFORM_SUPERADMIN_EMAIL` | Email del superadmin de la plataforma |
| `RESERVAYA_ENABLE_DEMO_MODE` | Activa el modo demo publico |
| `POCKETBASE_DEMO_OWNER_EMAIL` | Email del owner del negocio demo |
| `POCKETBASE_DEMO_OWNER_PASSWORD` | Password del owner del negocio demo |
| `POCKETBASE_DEMO_OWNER_BUSINESS_SLUG` | Slug del negocio demo |

---

## Routing

- `/` — Landing page de ReservaYa
- `/[slug]` — Pagina publica del negocio
- `/[slug]/reservar` — Flujo de reserva
- `/[slug]/confirmacion` — Confirmacion de reserva
- `/[slug]/mi-turno` — Gestionar turno (link firmado HMAC)
- `/[slug]/resena` — Dejar resena post-turno (link firmado HMAC)
- `/admin/*` — Panel de administracion del negocio
- `/platform/*` — Panel de administracion de la plataforma (superadmin)

---

## Notificaciones automaticas

- **Email de confirmacion** al cliente y al negocio (inmediato)
- **Email recordatorio** 24hs antes del turno (via cron)
- **Email follow-up** ~1h despues del turno con link a resena (via cron)
- **WhatsApp recordatorio** via Twilio (opcional, complementa email)

El cron corre todos los dias a las 10am ARG (1pm UTC) via Vercel Cron (`vercel.json`).
Endpoint: `GET /api/jobs/booking-reminders` con header `Authorization: Bearer {CRON_SECRET}`.

---

## Pagos

MercadoPago OAuth per-negocio. Cada negocio conecta su propia cuenta de MP desde el panel admin. El flujo:
1. Admin hace click en "Conectar MercadoPago"
2. OAuth redirect a MP con `MP_APP_ID`
3. Callback en `/api/auth/mercadopago/callback` guarda los tokens en el registro del negocio
4. Al crear un turno con precio > 0, se genera una preferencia de pago
5. Webhook en `/api/payments/webhook` confirma el pago y actualiza el estado del turno

---

## Modelo de datos (PocketBase)

Colecciones principales, todas filtradas por `business`:

| Coleccion | Descripcion |
|-----------|-------------|
| `businesses` | Negocios (un registro por cliente) |
| `users` | Usuarios admin del negocio (owner, admin, staff) |
| `services` | Servicios del negocio (precio, duracion, etc.) |
| `availability_rules` | Horarios semanales (dia, hora inicio/fin) |
| `blocked_slots` | Bloqueos especiales (feriados, vacaciones) |
| `customers` | Clientes del negocio |
| `bookings` | Turnos |
| `communication_events` | Historial de emails/WhatsApp enviados |
| `analytics_events` | Funnel: page_view → cta → booking_page → booking_created |
| `waitlist_entries` | Lista de espera cuando no hay horarios disponibles |
| `reviews` | Resenas post-turno |
| `subscriptions` | Suscripciones de los negocios (status: trial/active/cancelled/suspended, trialEndsAt, lockedAt) |

---

## Comandos utiles

```bash
# Desarrollo
npm run dev              # servidor de desarrollo (localhost:3000)
npm run build            # build productivo
npm run check            # lint + typecheck + test + build (CI completo)

# Tests
npm test                 # Vitest (watch mode)
npm test -- --run        # Vitest una sola vez
npm run test:coverage    # cobertura
npm run test:e2e         # Playwright e2e

# PocketBase local (Docker)
npm run pb:up            # levantar PocketBase
npm run pb:down          # bajar PocketBase
npm run pb:bootstrap     # seed inicial de colecciones
npm run pb:logs          # ver logs

# Demo
npm run demo:reset       # resetear datos de demo local
```

---

## Desarrollo local

```bash
git clone https://github.com/john2k2/reservaloYa.git
cd reservaloYa
npm install
cp .env.example .env.local
npm run dev
```

Sin variables de entorno configuradas, corre en **modo local** con datos de demo.
Abri `http://localhost:3000/demo-barberia` para ver el flujo completo.

Para usar PocketBase local:
```bash
npm run pb:up        # levanta PocketBase en Docker
npm run pb:bootstrap # crea las colecciones
# Agregar NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 en .env.local
```

---

## Herramientas CLI configuradas

Para trabajar con la infraestructura desde la terminal:

```bash
# Vercel
vercel ls                         # ver deployments
vercel env ls                     # ver variables de entorno
vercel deploy --prod               # deployar a produccion
vercel domains inspect reservaya.ar  # estado del dominio
vercel dns ls reservaya.ar        # ver registros DNS

# Railway (PocketBase)
railway link --project dynamic-joy   # linkear proyecto
railway logs                         # ver logs de PocketBase
railway vars                         # ver variables de entorno

# GitHub
gh repo view john2k2/reservaloYa
gh pr list
```

---

## Documentacion tecnica

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura detallada, flujos y decisiones tecnicas |
| [docs/ops/PROJECT_STATE.md](docs/ops/PROJECT_STATE.md) | Estado actual y criterios de lanzamiento |
| [docs/ops/GO_LIVE_CHECKLIST.md](docs/ops/GO_LIVE_CHECKLIST.md) | Checklist pre-produccion |
| [docs/ops/ENGINEERING_REMEDIATION_TRACKER.md](docs/ops/ENGINEERING_REMEDIATION_TRACKER.md) | Deuda tecnica y mejoras |
| [docs/setup/INTEGRATIONS.md](docs/setup/INTEGRATIONS.md) | Setup de Resend, Twilio, MercadoPago |
| [docs/setup/THEME_GUIDE.md](docs/setup/THEME_GUIDE.md) | Temas, CSS variables y dark mode |

---

## Estado del proyecto (2026-04-17)

### Funcionalidades completadas
- [x] Flujo publico de reserva completo (landing → servicio → fecha → hora → datos → confirmacion)
- [x] Panel admin funcional (dashboard, turnos, servicios, disponibilidad, clientes, equipo)
- [x] Onboarding con editor visual de pagina publica (logo, hero, galeria, paleta, redes)
- [x] Emails HTML con Resend desde turnos@reservaya.ar
- [x] Recordatorios 24hs y follow-up post-turno via cron
- [x] MercadoPago OAuth per-negocio
- [x] Tokens HMAC para links de gestion y resena
- [x] Rate limiting en creacion de turnos
- [x] Lista de espera (waitlist) con layout 2 columnas y politicas siempre visibles
- [x] Resenas post-turno
- [x] Analytics de embudo con UTM
- [x] CI: lint + typecheck + tests + coverage thresholds + smoke E2E
- [x] Dominio propio reservaya.ar en produccion
- [x] PocketBase en Railway con volumen persistente
- [x] ImprovMX email forwarding (hola@reservaya.ar) — MX records propagados
- [x] Contacto y WhatsApp del sitio configurados (541124057521 / hola@reservaya.ar)
- [x] Booking UX: boton confirmar deshabilitado hasta elegir horario
- [x] Booking UX: politicas de la reserva siempre visibles (sidebar en todos los estados)
- [x] Booking UX: soporte de WhatsApp con tono amigable
- [x] Pagina publica: seccion reordenada (Servicios → Galeria → FAQ → Horarios → Mapa)
- [x] Pagina publica: WhatsApp/redes ocultas cuando no estan configuradas
- [x] Onboarding: preview eliminada (muy chica en pantallas chicas)
- [x] Onboarding: opcion "Personalizado" en selector de paleta de colores
- [x] Bug fix: dias cerrados en disponibilidad ya no fallan validacion Zod
- [x] Lanzamiento publico en LinkedIn (2026-04-09)
- [x] Sistema de trials/suscripciones para negocios (trial 7-90 dias, lock automatico, extender/cancelar)
- [x] Panel de plataforma (`/platform/*`) con dashboard de metricas y gestion de businesses
- [x] UI responsive verificada en mobile (375px), tablet (768px) y desktop (1920px)

### Proximos pasos
- [ ] Crear negocios reales para pilotos (suegra + peluqueria externa)
- [ ] Implementar flow de upgrade a pago via MercadoPago
- [ ] Configurar webhook de MercadoPago para confirmar pagos automaticamente
- [ ] Video demo 30-45 segundos para publicaciones
- [ ] Seguimiento de pilotos y feedback
- [ ] Verificar dominio de sending en Resend (DKIM/SPF propagados)

---

## Paginas y componentes clave

### Paginas publicas (`src/app/(public)/[slug]/`)
| Archivo | Descripcion |
|---------|-------------|
| `page.tsx` | Landing publica del negocio (hero, servicios, galeria, FAQ, horarios, mapa) |
| `reservar/page.tsx` | Flujo de reserva step 1 (elegir servicio) y step 2 (fecha/hora/datos) |
| `confirmacion/page.tsx` | Pagina de confirmacion post-reserva |
| `mi-turno/page.tsx` | Gestion del turno (cancelar, reprogramar) via link HMAC |
| `resena/page.tsx` | Formulario de resena post-turno via link HMAC |

### Componentes del booking (`src/components/public/booking/`)
| Componente | Descripcion |
|------------|-------------|
| `booking-form-with-waitlist.tsx` | Form principal del step 2 — maneja slot seleccionado, datos del cliente, sidebar con resumen y politicas |
| `booking-date-time-picker.tsx` | Calendario + grilla de horarios por franja (Manana/Tarde/Noche) |
| `booking-schedule-section.tsx` | Wrapper del picker — fetches slots via API al cambiar fecha |
| `booking-service-picker.tsx` | Grid de servicios para el step 1 |
| `booking-selected-service-card.tsx` | Card del servicio elegido en step 2 |
| `booking-policy-card.tsx` | Politicas de la reserva (siempre visible) |
| `booking-support-card.tsx` | Contacto WhatsApp con negocio |
| `booking-steps-header.tsx` | Header con pasos (1-2-3) |

### Componentes de la pagina publica (`src/components/public/`)
| Componente | Descripcion |
|------------|-------------|
| `business-hero.tsx` | Hero de la pagina del negocio (logo, nombre, redes, CTA) |
| `sticky-header.tsx` | Header fijo al hacer scroll (logo, WhatsApp, boton reservar) |
| `faq-contact-section.tsx` | Seccion FAQ + politicas + contacto |
| `public-tracked-link.tsx` | Link con tracking de analytics |
| `public-analytics-tracker.tsx` | Registra eventos de funnel |

### Panel admin (`src/app/admin/(panel)/`)
| Ruta | Descripcion |
|------|-------------|
| `dashboard/` | Resumen de turnos, KPIs y actividad reciente |
| `bookings/` | Lista y gestion de turnos |
| `services/` | CRUD de servicios |
| `availability/` | Horarios semanales por dia |
| `customers/` | Lista de clientes |
| `onboarding/` | Editor visual de pagina publica (wizard + edicion directa) |
| `settings/` | Configuracion del negocio |
| `subscription/` | Estado de la suscripcion |

### Server actions y queries
| Archivo | Descripcion |
|---------|-------------|
| `src/server/actions/public-booking.ts` | Creacion de turnos publicos |
| `src/server/queries/public.ts` | Datos para paginas publicas (business, services, availability) |
| `src/server/booking-notifications.ts` | Emails y WhatsApp de confirmacion/recordatorio |
| `src/server/public-booking-links.ts` | Generacion y validacion de tokens HMAC |
| `src/lib/contact.ts` | WhatsApp y email de contacto del sitio |

---

## Pilotos planeados

Antes de escalar, dos negocios piloto sin costo a cambio de feedback:

1. **Negocio de limpieza** (familiar) — feedback interno sin filtro, primer cliente de confianza
2. **Peluqueria** (a definir) — cliente externo para feedback mas objetivo y caso de exito publico

Con estos dos pilotos funcionando se genera el material (testimonios, capturas, metricas) para las publicaciones y la estrategia comercial.
