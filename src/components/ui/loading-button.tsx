"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";
import type { ButtonVariants } from "./button-variants";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  children: ReactNode;
  pendingLabel?: string;
  loading?: boolean;
}

/**
 * Botón con estado de carga integrado
 * 
 * Uso con Server Actions (automático):
 * <LoadingButton pendingLabel="Guardando...">
 *   Guardar
 * </LoadingButton>
 * 
 * Uso manual (controlado):
 * <LoadingButton loading={isSubmitting} pendingLabel="Guardando...">
 *   Guardar
 * </LoadingButton>
 */
export function LoadingButton({
  children,
  className,
  variant = "default",
  size = "default",
  pendingLabel = "Cargando...",
  loading,
  disabled,
  ...props
}: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = loading ?? pending;

  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      aria-live="polite"
      aria-busy={isLoading}
      className={cn(
        buttonVariants({ variant, size }),
        isLoading && "cursor-not-allowed opacity-70",
        className
      )}
      {...props}
    >
      {isLoading ? (
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

export default LoadingButton;
