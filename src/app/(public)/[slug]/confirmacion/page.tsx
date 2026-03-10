import Link from "next/link";
import { Calendar, Check, Settings2 } from "lucide-react";
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
import { getBookingConfirmationData } from "@/server/queries/public";

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string }>;
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

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const confirmation = await getBookingConfirmationData({
    slug,
    bookingId: query.booking,
  });

  if (!confirmation) {
    notFound();
  }

  const formattedDate = formatDateLabel(confirmation.bookingDate);
  const formattedTime = formatTimeLabel(confirmation.startTime);
  const calendarHref = buildCalendarHref({
    title: `${confirmation.serviceName} en ${confirmation.businessName}`,
    details: `Reserva confirmada con ${confirmation.businessName}.`,
    location: confirmation.businessAddress,
    date: confirmation.bookingDate,
    startTime: confirmation.startTime,
    durationMinutes: confirmation.durationMinutes,
    timezone: confirmation.businessTimezone,
  });
  const manageHref = query.booking ? buildManageBookingHref(slug, query.booking) : null;

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background p-6 font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-8 flex size-20 items-center justify-center rounded-full bg-secondary">
          <Check aria-hidden="true" className="size-8 text-foreground" strokeWidth={2.5} />
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Reserva confirmada
        </h1>
        <p className="max-w-sm text-lg text-muted-foreground">
          Ya podes guardar los detalles y gestionar el turno cuando quieras.
        </p>

        <div className="mt-12 w-full rounded-2xl border border-border/70 bg-card p-8 text-left shadow-sm">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Detalles de la cita
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Fecha y hora</span>
              <span className="text-lg font-semibold text-card-foreground">
                {formattedDate} a las {formattedTime}
              </span>
            </div>
            <div className="h-px w-full bg-border/60" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Servicio</span>
              <span className="text-lg font-semibold text-card-foreground">
                {confirmation.serviceName}
              </span>
            </div>
            <div className="h-px w-full bg-border/60" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Lugar</span>
              <span className="text-lg font-semibold text-card-foreground">
                {confirmation.businessName}
              </span>
              <span className="text-sm text-muted-foreground">
                {confirmation.businessAddress}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex w-full flex-col justify-center gap-4">
          <a
            href={calendarHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full gap-2 rounded-md px-8"
            )}
          >
            <Calendar aria-hidden="true" className="size-4" />
            Anadir al calendario
          </a>

          {manageHref && (
            <Link
              href={manageHref}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 w-full gap-2 rounded-md px-8"
              )}
            >
              <Settings2 aria-hidden="true" className="size-4" />
              Ver, reprogramar o cancelar
            </Link>
          )}

          <Link
            href={`/${slug}`}
            className={cn(
              buttonVariants({ variant: "link", size: "default" }),
              "mx-auto h-auto px-0 text-sm font-semibold"
            )}
          >
            Reservar otro turno
          </Link>
        </div>

      </div>
    </main>
  );
}
