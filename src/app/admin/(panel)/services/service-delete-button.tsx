"use client";

import { useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

function ConfirmSubmitButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancelar"
        disabled={pending}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 text-muted-foreground"
        )}
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
      <button
        type="submit"
        disabled={pending}
        aria-live="polite"
        aria-busy={pending}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        )}
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          "Desactivar"
        )}
      </button>
    </div>
  );
}

export function ServiceDeleteButton() {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return <ConfirmSubmitButton onCancel={() => setConfirming(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Desactivar servicio"
      title="Desactivar servicio"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      )}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  );
}
