# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
npm run demo:reset       # Reset local demo data
npm run pb:up            # Start PocketBase via Docker
npm run pb:bootstrap     # Seed PocketBase collections
```

## Architecture

**Multi-tenant booking system** for small businesses (barber shops, salons, spas). Spanish-language UI.

### Dual Backend Modes

The app runs in one of two modes determined by env vars:

- **Local mode** (default): File-based JSON store at `data/local-store.json`. No external deps needed. Used for demo and local dev.
- **PocketBase mode**: When `NEXT_PUBLIC_POCKETBASE_URL` is set. Real auth and persistence.

Both backends implement the same interface. The store abstraction lives in:
- `src/server/local-store.ts` - file-based implementation
- `src/server/pocketbase-store.ts` - PocketBase implementation
- `src/server/local-domain.ts` - shared types (`Local*` types), `normalizeStore()`, and domain logic used by both stores

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

## Language

The codebase, UI text, and most documentation are in **Spanish**. Write user-facing strings, comments in existing files, and commit messages following the existing language conventions.
