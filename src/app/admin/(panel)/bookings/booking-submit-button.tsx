"use client";

import { useState } from "react";
import { LoaderCircle, Save, AlertTriangle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const DESTRUCTIVE_STATUSES = ["cancelled", "no_show"];

function SubmitInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className={cn(
        buttonVariants({ variant: "destructive", size: "lg" }),
        "h-11 w-full lg:w-auto lg:min-w-32"
      )}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          <span className="hidden sm:inline">Guardando...</span>
          <span className="sm:hidden">Guardando</span>
        </>
      ) : (
        <>
          <AlertTriangle aria-hidden="true" className="size-4" />
          Confirmar
        </>
      )}
    </button>
  );
}

export function BookingSubmitButton() {
  const [confirming, setConfirming] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    const statusSelect = form?.querySelector<HTMLSelectElement>('[name="status"]');
    if (statusSelect && DESTRUCTIVE_STATUSES.includes(statusSelect.value)) {
      e.preventDefault();
      setConfirming(true);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 lg:items-start">
        <p className="text-xs font-medium text-destructive">¿Confirmar cambio de estado?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-9 rounded-md"
            )}
          >
            Cancelar
          </button>
          <SubmitInner />
        </div>
      </div>
    );
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      aria-live="polite"
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "h-11 w-full lg:w-auto lg:min-w-32"
      )}
    >
      <Save aria-hidden="true" className="size-4" />
      Guardar
    </button>
  );
}
