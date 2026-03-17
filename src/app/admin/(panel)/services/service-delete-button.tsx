"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export function ServiceDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      aria-busy={pending}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      )}
      title={pending ? "Desactivando..." : "Desactivar servicio"}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Trash2 aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
