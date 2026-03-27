import Link from "next/link";
import { Calendar, Check, Clock, Settings2 } from "lucide-react";
import { notFound } from "next/navigation";

import {
  addMinutes,
  formatDateLabel,
  formatTimeLabel,
  parseDateParts,
  parseTimeParts,
} from "@/lib/bookings/format";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { buildManageBookingHref } from "@/server/public-booking-links";
import { getBookingConfirmationData, getPublicBusinessPageData } from "@/server/queries/public";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { getPublicBusinessProfile } from "@/constants/public-business-profiles";

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; payment?: string }>;
};

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
    getBookingConfirmationData({ slug, bookingId: query.booking }),
    getPublicBusinessPageData(slug),
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
  const manageHref = query.booking ? buildManageBookingHref(slug, query.booking) : null;

  // Estado de pago desde query param (MP back_url) o desde el booking guardado
  const paymentParam = query.payment; // "success" | "failure" | "pending" | undefined
  const paymentStatus = (confirmation as { paymentStatus?: string }).paymentStatus;
  const paymentProvider = (confirmation as { paymentProvider?: string }).paymentProvider;
  const storedPaymentAmount = (confirmation as { paymentAmount?: number }).paymentAmount;
  const hasExplicitPaymentContext = Boolean(paymentParam || paymentStatus || paymentProvider);
  const priceLabel = formatPrice(
    hasExplicitPaymentContext ? storedPaymentAmount ?? confirmation.priceAmount : confirmation.priceAmount,
    (confirmation as { paymentCurrency?: string }).paymentCurrency ?? confirmation.currency
  );

  const isPendingPayment =
    confirmation.status === "pending_payment" ||
    paymentParam === "pending" ||
    (paymentStatus && paymentStatus !== "approved" && paymentStatus !== "rejected");

  const isPaymentFailed = paymentParam === "failure" || paymentStatus === "rejected";
  const isPaymentSuccess =
    paymentParam === "success" ||
    paymentStatus === "approved" ||
    (paymentProvider === "mercadopago" && confirmation.status === "confirmed");
  const isCashPayment =
    Boolean(priceLabel) &&
    !paymentParam &&
    !paymentStatus &&
    paymentProvider !== "mercadopago" &&
    !isPendingPayment;

  const showPaymentBanner =
    priceLabel && (isPendingPayment || isPaymentFailed || isPaymentSuccess || isCashPayment);

  const profile = pageData?.profile ?? getPublicBusinessProfile(slug, slug);

  return (
    <PublicBusinessPageWrapper profile={profile}>
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">

        {/* Icono de estado */}
        <div className={cn(
          "mb-6 sm:mb-8 flex size-16 sm:size-20 items-center justify-center rounded-full",
          isPaymentFailed ? "bg-destructive/10" : "bg-secondary"
        )}>
          {isPaymentFailed ? (
            <Clock aria-hidden="true" className="size-6 sm:size-8 text-destructive" strokeWidth={2.5} />
          ) : (
            <Check aria-hidden="true" className="size-6 sm:size-8 text-foreground" strokeWidth={2.5} />
          )}
        </div>

        {/* Título */}
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          {isPaymentFailed
            ? "Pago no completado"
            : isPendingPayment
            ? "Reserva registrada"
            : isCashPayment
            ? "Reserva confirmada"
            : "Reserva confirmada"}
        </h1>
        <p className="max-w-sm text-base sm:text-lg text-muted-foreground">
          {isPaymentFailed
            ? "No se pudo procesar el pago. Tu reserva está guardada pero pendiente de pago."
            : isPendingPayment
            ? "Tu reserva está registrada. Quedará confirmada cuando se acredite el pago."
            : isCashPayment
            ? "Tu turno ya quedó reservado. El pago se realiza presencialmente en el negocio."
            : "Ya podés guardar los detalles y gestionar el turno cuando quieras."}
        </p>

        {/* Banner de estado de pago */}
        {showPaymentBanner && (
          <div className={cn(
            "mt-6 w-full rounded-xl border px-5 py-4 text-left text-sm",
            isPaymentFailed
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : isPaymentSuccess
              ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
              : "border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
          )}>
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
                Tu turno quedo reservado. El cobro se realiza presencialmente en el negocio.
              </p>
            )}
          </div>
        )}

        {/* Detalles del turno */}
        <div className="mt-8 sm:mt-10 w-full rounded-xl sm:rounded-2xl border border-border/70 bg-card p-5 sm:p-8 text-left shadow-sm">
          <h2 className="mb-4 sm:mb-6 text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Detalles de tu turno
          </h2>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha y hora</span>
              <span className="text-base sm:text-lg font-semibold text-card-foreground">
                {formattedDate} a las {formattedTime}
              </span>
            </div>
            <div className="h-px w-full bg-border/60" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Servicio</span>
              <span className="text-base sm:text-lg font-semibold text-card-foreground">
                {confirmation.serviceName}
              </span>
              {confirmation.priceAmount != null && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {formatPrice(confirmation.priceAmount)}
                </span>
              )}
            </div>
            <div className="h-px w-full bg-border/60" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Lugar</span>
              <span className="text-base sm:text-lg font-semibold text-card-foreground">
                {confirmation.businessName}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {confirmation.businessAddress}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 flex w-full flex-col justify-center gap-3">
          <a
            href={calendarHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 sm:h-12 w-full gap-2 rounded-xl px-6 sm:px-8"
            )}
          >
            <Calendar aria-hidden="true" className="size-4" />
            Añadir al calendario
          </a>

          {manageHref && (
            <Link
              href={manageHref}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 sm:h-12 w-full gap-2 rounded-xl px-6 sm:px-8"
              )}
            >
              <Settings2 aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Ver, reprogramar o cancelar</span>
              <span className="sm:hidden">Gestionar turno</span>
            </Link>
          )}

          <Link
            href={`/${slug}`}
            className={cn(
              buttonVariants({ variant: "link", size: "default" }),
              "mx-auto h-auto px-0 text-sm font-semibold min-h-10"
            )}
          >
            Reservar otro turno
          </Link>
        </div>

        {!isPaymentFailed && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Después de tu visita vas a recibir un email para dejarnos tu opinión.
          </p>
        )}

      </div>
    </main>
    </PublicBusinessPageWrapper>
  );
}
