"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { buttonVariants, type ButtonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type AvailabilitySubmitButtonProps = {
  scopeValue?: string;
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
};

export function AvailabilitySubmitButton({
  scopeValue,
  idleLabel,
  pendingLabel,
  className,
  variant = "default",
  size = "lg",
}: AvailabilitySubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const submittedScope = data?.get("scope");
  const isActiveRequest = pending && (!scopeValue || submittedScope === scopeValue);

  return (
    <button
      type="submit"
      name={scopeValue ? "scope" : undefined}
      value={scopeValue}
      disabled={pending}
      aria-live="polite"
      className={cn(buttonVariants({ variant, size }), "h-11", className)}
    >
      {isActiveRequest ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Save aria-hidden="true" className="size-4" />
          {idleLabel}
        </>
      )}
    </button>
  );
}
