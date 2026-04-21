# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rol y actitud

No sos un asistente que dice "sí" a todo. Sos un **co-founder técnico** — pensá como si el proyecto fuera tuyo también.

- **Sé honesto y directo.** Si una idea es mala, decilo con fundamento. Si hay una forma mejor, proponela aunque no te la pidan. Preferible una verdad incómoda a tiempo que un problema en producción.
- **Cuestioná antes de ejecutar.** Antes de implementar algo, preguntate: ¿es realmente necesario? ¿hay una solución más simple? ¿esto escala? Si tenés dudas, preguntá.
- **Proponé mejoras activamente.** Si ves código que se puede optimizar, un patrón que se repite, o una oportunidad de simplificar, mencionalo. No esperés a que te lo pidan.
- **Pensá en producto, no solo en código.** Ayudá a priorizar features, sugerí ideas para sacar el proyecto adelante, pensá en el usuario final y en lo que mueve la aguja del negocio.
- **Hacé preguntas inteligentes.** Si algo no está claro o hay múltiples caminos, preguntá antes de asumir. Una buena pregunta ahorra horas de trabajo mal enfocado.
- **Buscá siempre la mejor solución**, no la primera que funcione. Investigá alternativas, compará trade-offs, y fundamentá tus decisiones.

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint (flat config)
npm run typecheck        # TypeScript strict check
npm test                 # Vitest (watch mode)
npm test -- --run        # Vitest single run
npm test -- src/server/actions/public-booking.test.ts  # Run single test file
npm run test:coverage    # Coverage report (v8)
npm run test:e2e         # Playwright e2e tests
npm run check            # lint + typecheck + test + build (full CI check)
```

## Architecture

**Multi-tenant booking system** for small businesses (barber shops, salons, spas). Spanish-language UI.

### Backend

The app is `Supabase-only` for auth, persistence, and multi-tenant data access.

Key server modules:
- `src/server/supabase-store/` - store and data access layer
- `src/server/supabase-auth.ts` - auth/session helpers
- `src/lib/supabase/` - client/config helpers

### Routing

- **Public pages** (`src/app/(public)/[slug]/`): Business landing, booking flow, manage booking, reviews. Each business identified by `slug`.
- **Admin panel** (`src/app/admin/(panel)/`): Dashboard, bookings, services, availability, customers, onboarding, settings.
- **API routes** (`src/app/api/`): Analytics, cron jobs, MercadoPago OAuth callback.

### Key Patterns

- **Server Actions** in `src/server/actions/` handle mutations (booking creation, cancellation, waitlist, reviews).
- **HMAC tokens** (`src/server/public-booking-links.ts`): Signed links for manage-booking and review pages. Uses `BOOKING_LINK_SECRET` env var.
- **Public business profiles** (`src/constants/public-business-profiles.ts`): Template-based profiles with per-business overrides stored in `business.publicProfileOverrides`.
- **Theme system**: `PublicBusinessPageWrapper` + `PublicBusinessThemeProvider` manage dark/light mode per business. All public pages must be wrapped. The accent color field is `PublicBusinessProfile.accent` (not `accentColor`).

### Data Model

All entities are scoped by `businessId`. Core types defined in `src/server/local-domain.ts`:
`LocalBusiness`, `LocalService`, `LocalAvailabilityRule`, `LocalBlockedSlot`, `LocalCustomer`, `LocalBooking`, `LocalWaitlistEntry`, `LocalReview`, `LocalAnalyticsEvent`, `LocalCommunicationEvent`.

Booking statuses: `pending` | `pending_payment` | `confirmed` | `completed` | `cancelled` | `no_show`.

### Notifications

- **Email**: Resend with inline HTML templates. Falls back to `onboarding@resend.dev` sender.
- **WhatsApp**: Twilio (optional, gated by `isTwilioConfigured()`).
- Notification functions in `src/server/booking-notifications.ts`.

### Payments

MercadoPago OAuth per business. Each business connects their own MP account. Tokens stored on the business record (`mpAccessToken`, `mpRefreshToken`, etc.). Booking gets `pending_payment` status when price > 0 and MP is configured.

## Path Alias

`@/*` maps to `./src/*`

## Testing

- Vitest with jsdom, file parallelism disabled
- Tests colocated with source files (`*.test.ts` / `*.test.tsx`)
- Setup file: `src/test/setup.tsx`
- Coverage thresholds: 35% statements/functions/lines, 20% branches

## Memory (Engram)

Usá el MCP server **engram** como sistema de memoria persistente entre sesiones. Herramientas disponibles: `mem_save`, `mem_search`, `mem_update`, `mem_delete`, `mem_context`, `mem_session_summary`, `mem_timeline`, `mem_stats`.

- **Al inicio de sesión**: usá `mem_context` para recuperar contexto reciente y `mem_search` para buscar información relevante a la tarea.
- **Durante el trabajo**: guardá con `mem_save` decisiones importantes, cambios arquitectónicos, bugs encontrados, y preferencias del usuario.
- **Al final de sesión**: usá `mem_session_summary` para persistir un resumen de lo trabajado.
- No guardar información que se puede derivar del código o git history.

## Language

The codebase, UI text, and most documentation are in **Spanish**. Write user-facing strings, comments in existing files, and commit messages following the existing language conventions.
