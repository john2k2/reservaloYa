import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { Calendar, Check, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

import {
  addMinutes,
  formatDateLabel,
  formatTimeLabel,
  parseDateParts,
  parseTimeParts,
} from "@/lib/bookings/format";
import { getAccentForeground } from "@/lib/color-contrast";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getBookingConfirmationData, getPublicBusinessPageData } from "@/server/queries/public";
import { buildManageBookingHref } from "@/server/public-booking-links";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { TransactionalPageShell } from "@/components/public/transactional-page-shell";
import { BookingStepsHeader } from "@/components/public/booking/booking-steps-header";
import { resolvePublicProfile } from "@/constants/public-business-profiles";
import { generateTransactionalMetadata } from "@/lib/seo/business-metadata";

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; payment?: string; token?: string }>;
};

export async function generateMetadata({
  params,
}: ConfirmationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPageData(slug);

  return generateTransactionalMetadata({
    businessName: pageData?.business.name,
    slug,
    pathSuffix: "/confirmacion",
    titlePrefix: "Confirmación",
  });
}

function toCalendarStamp(date: string, time: string) {
  const { year, month, day } = parseDateParts(date);
  const { hours, minutes } = parseTimeParts(time);

  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(
    2,
    "0"
  )}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
}

function buildCalendarHref(input: {
  title: string;
  details: string;
  location: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
}) {
  const endTime = addMinutes(input.startTime, input.durationMinutes);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    details: input.details,
    location: input.location,
    dates: `${toCalendarStamp(input.date, input.startTime)}/${toCalendarStamp(
      input.date,
      endTime
    )}`,
    ctz: input.timezone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatPrice(amount: number | null | undefined, currency?: string) {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [confirmation, pageData] = await Promise.all([
    getBookingConfirmationData({ slug, bookingId: query.booking, token: query.token }),
    getPageData(slug),
  ]);

  if (!confirmation) {
    notFound();
  }

  const formattedDate = formatDateLabel(confirmation.bookingDate);
  const formattedTime = formatTimeLabel(confirmation.startTime);
  const calendarHref = buildCalendarHref({
    title: `${confirmation.serviceName} en ${confirmation.businessName}`,
    details: `Reserva confirmada con ${confirmation.businessName}.`,
    location: confirmation.businessAddress ?? "",
    date: confirmation.bookingDate,
    startTime: confirmation.startTime,
    durationMinutes: confirmation.durationMinutes,
    timezone: confirmation.businessTimezone,
  });
  const paymentParam = query.payment;
  const paymentStatus = confirmation.paymentStatus;
  const paymentProvider = confirmation.paymentProvider;
  const storedPaymentAmount = confirmation.paymentAmount;
  const hasExplicitPaymentContext = Boolean(paymentParam || paymentStatus || paymentProvider);
  const priceLabel = formatPrice(
    hasExplicitPaymentContext ? storedPaymentAmount ?? confirmation.priceAmount : confirmation.priceAmount,
    confirmation.paymentCurrency ?? confirmation.currency
  );

  const isPendingPayment =
    confirmation.status === "pending_payment" ||
    paymentParam === "pending" ||
    (paymentStatus && paymentStatus !== "approved" && paymentStatus !== "rejected");

  const isPaymentFailed = paymentParam === "failure" || paymentStatus === "rejected";
  const isPaymentSuccess =
    !isPendingPayment &&
    !isPaymentFailed &&
    (paymentParam === "success" ||
      paymentStatus === "approved" ||
      (paymentProvider === "mercadopago" && confirmation.status === "confirmed"));
  const isCashPayment =
    Boolean(priceLabel) &&
    !paymentParam &&
    !paymentStatus &&
    paymentProvider !== "mercadopago" &&
    !isPendingPayment;

  const showPaymentBanner =
    priceLabel && (isPendingPayment || isPaymentFailed || isPaymentSuccess || isCashPayment);

  const profile = resolvePublicProfile(pageData, slug);
  const accentColor = profile.accent;
  const manageBookingHref = query.booking
    ? buildManageBookingHref(slug, query.booking)
    : null;

  const heading = isPaymentFailed
    ? "Pago no completado"
    : isPendingPayment
      ? "Reserva registrada"
      : "Reserva confirmada";

  const subheading = isPaymentFailed
    ? "No se pudo procesar el pago. Tu reserva está guardada pero pendiente de pago."
    : isPendingPayment
      ? "Tu reserva está registrada. Quedará confirmada cuando se acredite el pago."
      : isCashPayment
        ? "Tu turno ya quedó reservado. El pago se realiza presencialmente en el negocio."
        : "Ya podés guardar los detalles y gestionar el turno cuando quieras.";

  return (
    <PublicBusinessPageWrapper profile={profile}>
      <TransactionalPageShell accentColor={accentColor} surfaceTint={pageData?.profile?.surfaceTint}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <BookingStepsHeader
            backHref={`/${slug}`}
            accentColor={accentColor}
            showIntroCard={false}
          />

          <div className="mx-auto max-w-2xl space-y-6">
            <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl sm:size-16",
                    isPaymentFailed ? "bg-destructive/10" : "bg-secondary"
                  )}
                  style={
                    !isPaymentFailed
                      ? { backgroundColor: `${accentColor}18` }
                      : undefined
                  }
                >
                  {isPaymentFailed ? (
                    <XCircle
                      aria-hidden="true"
                      className="size-7 text-destructive sm:size-8"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Check
                      aria-hidden="true"
                      className="size-7 sm:size-8"
                      strokeWidth={2.5}
                      style={{ color: accentColor }}
                    />
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {isPaymentFailed ? "Pago fallido" : "Confirmación"}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
                    {heading}
                  </h1>
                  <p className="mt-3 text-base text-pretty text-muted-foreground sm:text-lg">
                    {subheading}
                  </p>
                </div>
              </div>
            </section>

            {showPaymentBanner && (
              <div
                className={cn(
                  "rounded-[2rem] border px-5 py-4 text-left text-sm sm:px-6 sm:py-5",
                  isPaymentFailed
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : isPaymentSuccess
                      ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                      : "border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
                )}
              >
                <p className="font-semibold">
                  {isPaymentFailed
                    ? "Pago rechazado"
                    : isPaymentSuccess
                      ? `Pago aprobado${priceLabel ? ` - ${priceLabel}` : ""}`
                      : isCashPayment
                        ? `Pago en efectivo en el local${priceLabel ? ` - ${priceLabel}` : ""}`
                        : `Pago pendiente${priceLabel ? ` - ${priceLabel}` : ""}`}
                </p>
                {isPendingPayment && !isPaymentFailed && (
                  <p className="mt-1 text-xs opacity-80">
                    MercadoPago puede demorar unos minutos en confirmar el pago.
                  </p>
                )}
                {isCashPayment && (
                  <p className="mt-1 text-xs opacity-80">
                    Tu turno quedó reservado. El cobro se realiza presencialmente en el negocio.
                  </p>
                )}
              </div>
            )}

            <section className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur sm:p-8">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:mb-6">
                Detalles de tu turno
              </h2>

              <div className="space-y-3 sm:space-y-4">
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
                    Servicio
                  </span>
                  <span className="text-base font-semibold text-card-foreground sm:text-lg">
                    {confirmation.serviceName}
                  </span>
                  {confirmation.priceAmount != null && (
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {formatPrice(confirmation.priceAmount)}
                    </span>
                  )}
                </div>
                <div className="h-px w-full bg-border/60" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Lugar
                  </span>
                  <span className="text-base font-semibold text-card-foreground sm:text-lg">
                    {confirmation.businessName}
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {confirmation.businessAddress}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              {manageBookingHref && (
                <Link
                  href={manageBookingHref}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 w-full gap-2 rounded-[1rem] px-6 active:scale-[0.96] transition-transform sm:h-12 sm:px-8"
                  )}
                  style={{
                    backgroundColor: accentColor,
                    color: getAccentForeground(accentColor),
                  }}
                >
                  Ver mi turno
                </Link>
              )}

              <a
                href={calendarHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full gap-2 rounded-[1rem] px-6 sm:h-12 sm:px-8"
                )}
              >
                <Calendar aria-hidden="true" className="size-4" />
                Añadir al calendario
              </a>

              <Link
                href={`/${slug}/reservar`}
                className={cn(
                  buttonVariants({ variant: "link", size: "default" }),
                  "mx-auto h-auto min-h-10 px-0 text-sm font-semibold"
                )}
              >
                Reservar otro turno
              </Link>
            </div>

            {!isPaymentFailed && (
              <p className="text-center text-xs text-muted-foreground">
                Después de tu visita vas a recibir un email para dejarnos tu opinión.
              </p>
            )}
          </div>
        </div>
      </TransactionalPageShell>
    </PublicBusinessPageWrapper>
  );
}
