"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { cancelPublicBookingAction } from "@/server/actions/public-booking";
import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  bookingId: string;
  manageToken: string;
}

export function CancelBookingConfirmButton({ slug, bookingId, manageToken }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 sm:h-12 w-full rounded-xl sm:rounded-md border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive/60"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarX2 aria-hidden="true" className="size-4" />
          Cancelar turno
        </span>
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4 space-y-3">
      <p className="text-sm font-semibold text-destructive text-center">
        ¿Seguro que querés cancelar el turno?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "flex-1 h-10 rounded-lg"
          )}
        >
          No, volver
        </button>
        <form action={cancelPublicBookingAction} className="flex-1">
          <input type="hidden" name="businessSlug" value={slug} />
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="manageToken" value={manageToken} />
          <PublicSubmitButton
            className="h-10 w-full rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            pendingLabel="Cancelando..."
          >
            Sí, cancelar
          </PublicSubmitButton>
        </form>
      </div>
    </div>
  );
}
