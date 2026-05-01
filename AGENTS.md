## ReservaYa — Agent Instructions

Sistema de turnos online multi-tenant (Next.js 16 + React 19 + TypeScript strict + Supabase). UI y commits en español.

---

## Commands

```bash
# Dev & build
npm run dev              # localhost:3000
npm run build            # prod build
npm run build:analyze    # with bundle analyzer

# Verification (exact CI order)
npm run lint             # ESLint flat config
npm run typecheck        # tsc --noEmit (strict)
npm test -- --run        # Vitest single run
npm run build            # must pass last
npm run check            # runs all of the above in sequence

# Testing
npm test                 # Vitest watch mode
npm test -- src/server/actions/public-booking.test.ts  # single file
npm run test:coverage    # v8 coverage, thresholds enforced
npm run test:e2e         # Playwright public-smoke (Firefox)
npm run test:e2e:admin   # Playwright admin-authenticated (requires setup)
npm run test:e2e:all     # all Playwright projects
```

**Never build after changes** — the project rule forbids it. Run `lint` and `typecheck` instead.

---

## Architecture

- **Backend**: Supabase-only. No custom API server. Auth, DB, RLS, and storage all live in Supabase.
- **Data access**: `src/server/supabase-store/` for DB operations; `src/server/supabase-auth.ts` for session/auth helpers.
- **Multi-tenant**: every entity is scoped by `business_id` (or `businessSlug` in public routes).
- **Server Actions**: mutations live in `src/server/actions/`. They are standard Next.js server actions (`"use server"`).
- **Public pages**: `src/app/(public)/[slug]/` — landing, booking flow (`/reservar`), confirmation, manage booking (`/mi-turno`), review (`/resena`).
- **Admin panel**: `src/app/admin/(panel)/` — dashboard, bookings, services, availability, customers, onboarding, settings, subscription.
- **Platform panel**: `src/app/platform/(panel)/` — superadmin metrics and business management.
- **API routes**: `src/app/api/` — analytics, cron (`/api/jobs/booking-reminders`), MercadoPago OAuth callback, payment webhooks.
- **Domain types**: `src/server/supabase-domain.ts` defines `BookingStatus`, `BusinessRecord`, `ServiceRecord`, etc.

---

## Key Patterns & Gotchas

- **HMAC tokens**: public manage-booking and review links are signed with `BOOKING_LINK_SECRET`. Validation logic is in `src/server/public-booking-links.ts`.
- **Theme system**: all public pages must be wrapped with `PublicBusinessPageWrapper` + `PublicBusinessThemeProvider`. The accent color field is `PublicBusinessProfile.accent` (not `accentColor`).
- **Public business profiles**: template-based defaults with per-business overrides stored in `business.publicProfileOverrides` (JSON string). See `src/constants/public-business-profiles.ts`.
- **Booking statuses**: `pending` | `pending_payment` | `confirmed` | `completed` | `cancelled` | `no_show`.
- **Payments**: MercadoPago OAuth per-business. When price > 0 and MP is connected, booking gets `pending_payment` until webhook confirmation.
- **Notifications**: Resend email (inline HTML templates) + optional Twilio WhatsApp. Gated by `isTwilioConfigured()`.
- **Cron**: Vercel cron at 13:00 UTC daily hits `/api/jobs/booking-reminders` with `Authorization: Bearer {CRON_SECRET}`.
- **Rate limiting**: public booking creation is rate-limited (`src/server/rate-limit.ts`).

---

## Testing

- **Framework**: Vitest + jsdom + Testing Library. Playwright for E2E.
- **Setup**: `src/test/setup.tsx` mocks `next/navigation`, `next/image`, `next/link`, and `IntersectionObserver`.
- **File parallelism**: explicitly disabled in Vitest config (`fileParallelism: false`). Do not enable.
- **Coverage thresholds**: 35% statements/functions/lines, 20% branches (enforced in CI).
- **E2E projects**:
  - `public-smoke` (Firefox) — stable smoke tests
  - `admin-authenticated` (Chrome) — requires auth setup state
  - `manual-chromium`, `manual-mobile`, `manual-firefox` — ad-hoc suites
- **Single test file**: `npm test -- <path>`

---

## Environment

Required for local dev (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOKING_LINK_SECRET`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
- MercadoPago vars (`MP_APP_ID`, `MP_APP_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`)
- Twilio vars (optional)
- `CRON_SECRET`
- `PLATFORM_SUPERADMIN_EMAIL`

`vitest.config.ts` loads `.env.test` if present.

---

## Style & Conventions

- **Language**: UI strings, comments, and commit messages are in **Spanish**.
- **Path alias**: `@/*` maps to `./src/*`.
- **Commits**: conventional commits only. Never add "Co-Authored-By" or AI attribution.
- **ESLint**: flat config (`eslint.config.mjs`), extends `eslint-config-next/core-web-vitals` and `typescript`.
- **TypeScript**: strict mode, `noEmit`, bundler resolution.
- **Tailwind**: v4 with `@tailwindcss/postcss`. shadcn/ui v4.

---

## CI

GitHub Actions (`ubuntu-latest`, Node 22):
1. `npm ci`
2. `npm run check` (lint + typecheck + tests + build)
3. `npm run test:coverage` (separate job, uploads artifact)
4. E2E smoke runs only on `workflow_dispatch` against production URL.

---

## Directory Quick Reference

| Path | Purpose |
|------|---------|
| `src/app/(public)/[slug]/` | Public business pages |
| `src/app/admin/(panel)/` | Admin dashboard |
| `src/app/platform/(panel)/` | Superadmin panel |
| `src/app/api/` | API routes (cron, webhooks, analytics) |
| `src/server/actions/` | Server Actions for mutations |
| `src/server/queries/` | Server-side data fetching helpers |
| `src/server/supabase-store/` | Supabase data access layer |
| `src/server/supabase-domain.ts` | Core domain types |
| `src/components/public/booking/` | Booking flow components |
| `src/lib/supabase/` | Supabase client/config helpers |
| `src/test/setup.tsx` | Vitest setup and mocks |
| `supabase/migrations/` | Versioned Supabase migrations |
| `e2e/` | Playwright tests |

---

## Other Instruction Files

- `CLAUDE.md` — co-founder technical guidance, architecture details, and engram memory protocol.
