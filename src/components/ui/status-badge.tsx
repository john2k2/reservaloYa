import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "warning" | "danger" | "neutral";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusBadgeTone;
  /** "sm": pill compacto para tablas/listas (default). "md": chip con borde e ícono, para un estado destacado de página. */
  size?: "sm" | "md";
  icon?: ReactNode;
  children: ReactNode;
}

// --success/--warning/--destructive (globals.css) definen valores distintos
// para :root y .dark: estas clases resuelven dark mode solas, sin variantes dark:.
const toneStyles: Record<StatusBadgeTone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  neutral: "bg-secondary text-muted-foreground border-border",
};

const sizeStyles = {
  sm: "gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  md: "gap-2 border px-3 py-1.5 text-sm font-medium",
} as const;

/**
 * Pill de estado reutilizable (activo/inactivo, suscripción, verificación, etc).
 * Reemplaza los "status pills" reinventados de forma independiente en cada page.tsx.
 */
export function StatusBadge({
  tone,
  size = "sm",
  icon,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full",
        sizeStyles[size],
        toneStyles[tone],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
