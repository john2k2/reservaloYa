"use client";

import { useState, useCallback } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  validate?: (value: string) => string | null;
  hint?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
  className?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  onBlur,
  validate,
  hint,
  maxLength,
  options,
  className,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validate) {
      setError(validate(value));
    }
    onBlur?.();
  }, [validate, value, onBlur]);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (touched && validate) {
        setError(validate(newValue));
      }
    },
    [onChange, touched, validate]
  );

  const isValid = touched && !error && value.length > 0;
  const hasError = touched && error;

  const inputClasses = cn(
    "w-full rounded-md border bg-background px-3 py-2.5 text-sm transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2",
    hasError
      ? "border-destructive focus-visible:ring-destructive/20"
      : isValid
      ? "border-success focus-visible:ring-success/20"
      : "border-border focus-visible:ring-foreground/20",
    className
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground flex items-center gap-1"
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {maxLength && (
          <span
            className={cn(
              "text-xs",
              value.length > maxLength * 0.9
                ? "text-amber-600"
                : "text-muted-foreground"
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(inputClasses, "min-h-[100px] resize-none")}
        />
      ) : type === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={inputClasses}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(inputClasses, hasError && "pr-10", isValid && "pr-10")}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />
          )}
          {isValid && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-success" />
          )}
        </div>
      )}

      {hasError && <p className="text-xs text-destructive">{error}</p>}
      {hint && !hasError && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
