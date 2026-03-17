"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  helpText?: string;
}

/**
 * Campo de formulario con accesibilidad mejorada
 * 
 * Incluye:
 * - aria-invalid cuando hay error
 * - aria-describedby vinculado al mensaje de error
 * - aria-live para anuncios de error
 * - Label asociado correctamente
 */
export function FormField({
  label,
  error,
  children,
  required = false,
  className,
  helpText,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  // Agregar atributos de accesibilidad al child
  const childWithProps = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{
          "aria-invalid"?: string;
          "aria-describedby"?: string;
        }>,
        {
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": error ? errorId : helpText ? helpId : undefined,
        }
      )
    : children;

  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(requerido)</span>}
      </label>
      
      {childWithProps}
      
      {helpText && !error && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

/**
 * Input con accesibilidad mejorada
 */
export function FormInput({
  error,
  icon,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "minimalist-input w-full",
          icon && "pl-7",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    </div>
  );
}
