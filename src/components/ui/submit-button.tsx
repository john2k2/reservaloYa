"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";
import type { ButtonVariants } from "./button-variants";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  children: ReactNode;
  pendingLabel?: string;
  showSpinner?: boolean;
}

/**
 * Botón de submit con estado de carga automático
 * 
 * Uso:
 * <SubmitButton pendingLabel="Filtrando...">
 *   Filtrar
 * </SubmitButton>
 */
export function SubmitButton({
  children,
  className,
  variant = "default",
  size = "default",
  pendingLabel,
  showSpinner = true,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const label = pendingLabel ?? (typeof children === "string" ? `${children}...` : "Cargando...");

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-live="polite"
      aria-busy={pending}
      className={cn(
        buttonVariants({ variant, size }),
        pending && "cursor-not-allowed opacity-70",
        className
      )}
      {...props}
    >
      {pending && showSpinner ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          <span>{label}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
