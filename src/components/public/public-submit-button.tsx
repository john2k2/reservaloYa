"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { CSSProperties } from "react";

type PublicSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  style?: CSSProperties;
};

export function PublicSubmitButton({
  children,
  className,
  pendingLabel = "Confirmando reserva...",
  style,
}: Readonly<PublicSubmitButtonProps>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-live="polite"
      disabled={pending}
      style={style}
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "h-14 w-full rounded-md text-base font-semibold md:text-lg",
        className
      )}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
