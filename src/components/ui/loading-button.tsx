"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";
import type { ButtonVariants } from "./button-variants";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  pendingLabel?: string; // Alias for loadingLabel (for compatibility)
  showSpinner?: boolean;
}

/**
 * Botón con estado de carga controlado manualmente
 * Útil para acciones asíncronas fuera de formularios
 * 
 * Uso:
 * <LoadingButton isLoading={isPending} loadingLabel="Guardando...">
 *   Guardar cambios
 * </LoadingButton>
 */
export function LoadingButton({
  children,
  className,
  variant = "default",
  size = "default",
  isLoading,
  loadingLabel,
  pendingLabel,
  showSpinner = true,
  disabled,
  ...props
}: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const resolvedLoading = isLoading ?? pending;
  const label = loadingLabel ?? pendingLabel ?? (typeof children === "string" ? `${children}...` : "Cargando...");

  return (
    <button
      type="submit"
      disabled={resolvedLoading || disabled}
      aria-live="polite"
      aria-busy={resolvedLoading}
      className={cn(
        buttonVariants({ variant, size }),
        "relative transition-all duration-200",
        resolvedLoading && "cursor-not-allowed opacity-70",
        !resolvedLoading && !disabled && "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {resolvedLoading && showSpinner && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        </span>
      )}
      <span className={cn(resolvedLoading && showSpinner && "invisible")}>
        {resolvedLoading ? label : children}
      </span>
    </button>
  );
}
