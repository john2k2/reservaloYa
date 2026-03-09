"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function BookingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 min-w-32")}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <Save aria-hidden="true" className="size-4" />
          Guardar
        </>
      )}
    </button>
  );
}
