"use client";

import { useActionState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { joinWaitlistAction, type WaitlistActionResult } from "@/server/actions/waitlist";
import { formatDateLabel } from "@/lib/bookings/format";

interface BookingWaitlistFormProps {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  accentColor: string;
}

const initialState: WaitlistActionResult | null = null;

export function BookingWaitlistForm({
  businessSlug,
  serviceId,
  bookingDate,
  accentColor,
}: BookingWaitlistFormProps) {
  const [state, action, isPending] = useActionState(joinWaitlistAction, initialState);

  if (state?.success) {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-6 text-center">
        <CheckCircle2 className="size-6 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">Te anotamos en la lista</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Te vamos a avisar por email si se libera un lugar para el{" "}
            {formatDateLabel(bookingDate)}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-background/60 px-4 py-5">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">¿Querés anotarte en la lista?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Si alguien cancela para el {formatDateLabel(bookingDate)}, te avisamos por email.
          </p>
        </div>
      </div>

      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="bookingDate" value={bookingDate} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="waitlist-fullName" className="sr-only">
              Nombre completo
            </label>
            <input
              id="waitlist-fullName"
              name="fullName"
              placeholder="Tu nombre"
              required
              minLength={2}
              maxLength={120}
              className="minimalist-input text-sm"
            />
          </div>
          <div>
            <label htmlFor="waitlist-email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              placeholder="Tu email"
              required
              className="minimalist-input text-sm"
            />
          </div>
        </div>

        {state && !state.success && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          style={isPending ? undefined : { borderColor: accentColor + "40" }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BellRing className="size-4" />
          )}
          {isPending ? "Registrando..." : "Avisame si hay lugar"}
        </button>
      </form>
    </div>
  );
}
