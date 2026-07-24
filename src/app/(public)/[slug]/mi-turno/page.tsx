import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { CalendarClock, CalendarX2, RefreshCcw } from "lucide-react";

import { formatDateLabel, formatTimeLabel } from "@/lib/bookings/format";
import { getAccentForeground } from "@/lib/color-contrast";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getPublicBusinessPageData, getPublicManageBookingData } from "@/server/queries/public";
import { resolvePublicBookingFlashMessage } from "@/lib/public-booking-flash-messages";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { TransactionalPageShell } from "@/components/public/transactional-page-shell";
import { BookingStepsHeader } from "@/components/public/booking/booking-steps-header";
import { resolvePublicProfile } from "@/constants/public-business-profiles";
import { CancelBookingConfirmButton } from "./cancel-booking-confirm-button";
import { generateTransactionalMetadata } from "@/lib/seo/business-metadata";

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

type ManageBookingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; token?: string; error?: string; status?: string }>;
};

export async function generateMetadata({
  params,
}: ManageBookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPageData(slug);

  return generateTransactionalMetadata({
    businessName: pageData?.business.name,
    slug,
    pathSuffix: "/mi-turno",
    titlePrefix: "Mi turno",
  });
}

export default async function ManageBookingPage({
  params,
  searchParams,
}: ManageBookingPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [booking, pageData] = await Promise.all([
    getPublicManageBookingData({ slug, bookingId: query.booking, token: query.token }),
    getPageData(slug),
  ]);

  const profile = resolvePublicProfile(pageData, slug);
  const accentColor = profile.accent;
  const error = resolvePublicBookingFlashMessage(query.error);
  const status = query.status ?? "";

  if (!booking) {
    return (
      <PublicBusinessPageWrapper profile={profile}>
        <TransactionalPageShell accentColor={accentColor} surfaceTint={pageData?.profile?.surfaceTint}>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <BookingStepsHeader
              backHref={`/${slug}`}
              accentColor={accentColor}
              overline="Tu turno"
              title="No pudimos abrir tu turno"
              showSteps={false}
            />

            <div className="mx-auto max-w-2xl">
              <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 text-center shadow-sm backdrop-blur sm:p-8">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 sm:size-16">
                  <CalendarX2
                    aria-hidden="true"
                    className="size-7 text-destructive sm:size-8"
                    strokeWidth={2.5}
                  />
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  No pudimos abrir tu turno
                </h1>
                <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                  El link puede haber expirado o ser inválido.
                </p>
                <Link
                  href={`/${slug}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "mt-8 inline-flex h-11 w-full gap-2 rounded-[1rem] px-6 sm:h-12 sm:px-8"
                  )}
                  style={{
                    backgroundColor: accentColor,
                    color: getAccentForeground(accentColor),
                  }}
                >
                  Volver al negocio
                </Link>
              </section>
            </div>
          </div>
        </TransactionalPageShell>
      </PublicBusinessPageWrapper>
    );
  }

  const isClosedStatus = ["cancelled", "completed", "no_show"].includes(booking.status);
  const manageHref = `/${slug}/reservar?service=${booking.serviceId}&date=${booking.bookingDate}&reschedule=${booking.id}&token=${query.token ?? ""}`;
  const formattedDate = formatDateLabel(booking.bookingDate);
  const formattedTime = formatTimeLabel(booking.startTime);

  return (
    <PublicBusinessPageWrapper profile={profile}>
      <TransactionalPageShell accentColor={accentColor} surfaceTint={pageData?.profile?.surfaceTint}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <BookingStepsHeader
            backHref={`/${slug}`}
            accentColor={accentColor}
            overline="Tu turno"
            title="Gestioná tu reserva"
            showSteps={false}
          />

          <div className="mx-auto max-w-2xl space-y-6">
            <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl sm:size-16"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  <CalendarClock
                    aria-hidden="true"
                    className="size-7 sm:size-8"
                    strokeWidth={2.5}
                    style={{ color: accentColor }}
                  />
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {isClosedStatus ? "Turno cerrado" : "Turno activo"}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
                    {booking.serviceName}
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Desde acá podés ver, reprogramar o cancelar la reserva.
                  </p>
                </div>
              </div>
            </section>

            {status === "cancelled" && (
              <div className="rounded-[2rem] border border-border/70 bg-secondary/60 px-5 py-4 text-sm sm:px-6">
                Turno cancelado correctamente.
              </div>
            )}

            {error && (
              <div className="rounded-[2rem] border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive sm:px-6">
                {error}
              </div>
            )}

            <section className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur sm:p-8">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:mb-6">
                Detalles del turno
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Estado
                  </span>
                  <span className="text-base font-semibold text-card-foreground sm:text-lg">
                    {booking.statusLabel}
                  </span>
                </div>
                <div className="h-px w-full bg-border/60" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Servicio
                  </span>
                  <span className="text-base font-semibold text-card-foreground sm:text-lg">
                    {booking.serviceName}
                  </span>
                </div>
                <div className="h-px w-full bg-border/60" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Fecha y hora
                  </span>
                  <span className="text-base font-semibold text-card-foreground tabular-nums sm:text-lg">
                    {formattedDate} a las {formattedTime}
                  </span>
                </div>
                <div className="h-px w-full bg-border/60" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Cliente
                  </span>
                  <span className="text-base font-semibold text-card-foreground sm:text-lg">
                    {booking.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {booking.phone}
                  </span>
                  {booking.email && (
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {booking.email}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {isClosedStatus ? (
                <button
                  type="button"
                  disabled
                  aria-disabled
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 gap-2 rounded-[1rem] opacity-50 sm:h-12"
                  )}
                  style={{
                    backgroundColor: accentColor,
                    color: getAccentForeground(accentColor),
                  }}
                >
                  <RefreshCcw aria-hidden="true" className="size-4" />
                  Reprogramar
                </button>
              ) : (
                <Link
                  href={manageHref}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 gap-2 rounded-[1rem] active:scale-[0.96] transition-transform sm:h-12"
                  )}
                  style={{
                    backgroundColor: accentColor,
                    color: getAccentForeground(accentColor),
                  }}
                >
                  <RefreshCcw aria-hidden="true" className="size-4" />
                  Reprogramar
                </Link>
              )}

              {isClosedStatus ? (
                <div
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "pointer-events-none h-11 gap-2 rounded-[1rem] opacity-50 sm:h-12"
                  )}
                >
                  <CalendarX2 aria-hidden="true" className="size-4" />
                  Cancelar turno
                </div>
              ) : (
                <CancelBookingConfirmButton
                  slug={slug}
                  bookingId={booking.id}
                  manageToken={query.token ?? ""}
                />
              )}
            </div>

            {isClosedStatus && (
              <p className="text-center text-sm text-muted-foreground">
                Este turno ya no admite cambios desde este link.
              </p>
            )}
          </div>
        </div>
      </TransactionalPageShell>
    </PublicBusinessPageWrapper>
  );
}
