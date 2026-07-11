"use client";

import { useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
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
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 sm:h-12 w-full rounded-[1rem] border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive/60 active:scale-[0.96] transition-transform"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarX2 aria-hidden="true" className="size-4" />
          Cancelar turno
        </span>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup
            className={cn(
              "w-full max-w-md rounded-[1.25rem] border border-border/70 bg-card p-5 shadow-lg sm:p-6",
              "data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-[transform,opacity] duration-200"
            )}
          >
            <AlertDialog.Title className="text-lg font-semibold text-foreground">
              ¿Cancelar este turno?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              Esta acción libera el horario. Si necesitás otro día, podés reprogramar en lugar de
              cancelar.
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "h-11 w-full rounded-[1rem] sm:w-auto sm:min-w-[8rem]"
                )}
              >
                No, volver
              </AlertDialog.Close>

              <form action={cancelPublicBookingAction} className="w-full sm:w-auto">
                <input type="hidden" name="businessSlug" value={slug} />
                <input type="hidden" name="bookingId" value={bookingId} />
                <input type="hidden" name="manageToken" value={manageToken} />
                <PublicSubmitButton
                  className="h-11 w-full rounded-[1rem] bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:min-w-[8rem] active:scale-[0.96] transition-transform"
                  pendingLabel="Cancelando..."
                >
                  Sí, cancelar
                </PublicSubmitButton>
              </form>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
