import Link from "next/link";
import { CalendarClock, CalendarX2, RefreshCcw } from "lucide-react";

import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateLabel, formatTimeLabel } from "@/lib/bookings/format";
import { cn } from "@/lib/utils";
import { cancelPublicBookingAction } from "@/server/actions/public-booking";
import { getPublicManageBookingData } from "@/server/queries/public";

type ManageBookingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; token?: string; error?: string; status?: string }>;
};

export default async function ManageBookingPage({
  params,
  searchParams,
}: ManageBookingPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const booking = await getPublicManageBookingData({
    slug,
    bookingId: query.booking,
    token: query.token,
  });

  const error = query.error ?? "";
  const status = query.status ?? "";

  if (!booking) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background p-6 font-sans text-foreground"
      >
        <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card p-5 sm:p-8 text-center shadow-sm">
          <h1 className="text-xl sm:text-2xl font-semibold text-card-foreground">
            No pudimos abrir tu turno
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            El link puede haber expirado o ser inválido.
          </p>
          <Link
            href={`/${slug}`}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "mt-6 h-11 sm:h-12 w-full rounded-xl sm:rounded-md"
            )}
          >
            Volver al sitio
          </Link>
        </div>
      </main>
    );
  }

  const isClosedStatus = ["cancelled", "completed", "no_show"].includes(booking.status);
  const manageHref = `/${slug}/reservar?service=${booking.serviceId}&date=${booking.bookingDate}&reschedule=${booking.id}&token=${query.token ?? ""}`;

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="mx-auto w-full max-w-xl py-4 sm:py-8">
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-semibold text-card-foreground">Tu turno</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Desde acá podés ver, reprogramar o cancelar la reserva.
          </p>

          {status === "cancelled" && (
            <div className="mt-6 rounded-lg border border-border/70 bg-secondary/60 p-4 text-sm">
              Turno cancelado correctamente.
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Estado</p>
              <p className="text-base sm:text-lg font-semibold text-card-foreground">{booking.statusLabel}</p>
            </div>
            <div className="h-px bg-border/60" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Servicio</p>
              <p className="text-base sm:text-lg font-semibold text-card-foreground">{booking.serviceName}</p>
            </div>
            <div className="h-px bg-border/60" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha y hora</p>
              <p className="text-base sm:text-lg font-semibold text-card-foreground">
                {formatDateLabel(booking.bookingDate)} a las {formatTimeLabel(booking.startTime)}
              </p>
            </div>
            <div className="h-px bg-border/60" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="text-base sm:text-lg font-semibold text-card-foreground">{booking.fullName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{booking.phone}</p>
              {booking.email && <p className="text-xs sm:text-sm text-muted-foreground">{booking.email}</p>}
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-3 sm:gap-4 sm:grid-cols-2">
            <Link
              href={manageHref}
              aria-disabled={isClosedStatus}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 sm:h-12 gap-2 rounded-xl sm:rounded-md",
                isClosedStatus && "pointer-events-none opacity-50"
              )}
            >
              <RefreshCcw aria-hidden="true" className="size-4" />
              Reprogramar
            </Link>

            {isClosedStatus ? (
              <div
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "pointer-events-none h-11 sm:h-12 gap-2 rounded-xl sm:rounded-md opacity-50"
                )}
              >
                <CalendarX2 aria-hidden="true" className="size-4" />
                Cancelar turno
              </div>
            ) : (
              <form action={cancelPublicBookingAction} className="w-full">
                <input type="hidden" name="businessSlug" value={slug} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="manageToken" value={query.token ?? ""} />
                <PublicSubmitButton
                  className="h-11 sm:h-12 w-full rounded-xl sm:rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  pendingLabel="Cancelando turno..."
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarX2 aria-hidden="true" className="size-4" />
                    Cancelar turno
                  </span>
                </PublicSubmitButton>
              </form>
            )}
          </div>

          {isClosedStatus && (
            <p className="mt-4 text-sm text-muted-foreground">
              Este turno ya no admite cambios desde este link.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href={`/${slug}`}
            className={cn(
              buttonVariants({ variant: "link", size: "default" }),
              "inline-flex gap-2 px-0 text-sm font-semibold min-h-10"
            )}
          >
            <CalendarClock aria-hidden="true" className="size-4" />
            Volver a la página pública
          </Link>
        </div>
      </div>
    </main>
  );
}
