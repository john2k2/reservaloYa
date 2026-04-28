"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "default" | "bookings" | "customers" | "services";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  bookings: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  customers: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  services: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-16",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl mb-5 sm:mb-6",
            styles.iconBg
          )}
        >
          <span className={cn("h-7 w-7 sm:h-8 sm:w-8", styles.iconColor)}>{icon}</span>
        </div>
      )}
      <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2 px-4 sm:px-0">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5 sm:mb-6 leading-relaxed px-6 sm:px-0">
        {description}
      </p>
      {action && <div className="mt-2 w-full sm:w-auto px-4 sm:px-0">{action}</div>}
    </div>
  );
}

// Variantes predefinidas con mensajes personalizados
export function EmptyBookings({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      variant="bookings"
      title="Todavía no hay turnos"
      description="Cuando tus clientes empiecen a reservar, vas a verlos acá. ¡Es un buen momento para tomar un café! ☕"
      action={action}
    />
  );
}

export function EmptyCustomers({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      variant="customers"
      title="Tu base de clientes está vacía"
      description="Todavía no tenés clientes registrados. Cuando empiecen a reservar, van a aparecer acá automáticamente."
      action={action}
    />
  );
}

export function EmptyServices({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      variant="services"
      title="No hay servicios configurados"
      description="Agregá tus servicios para que tus clientes puedan reservar. Barbería, manicura, masajes... ¡lo que ofrezcas!"
      action={action}
    />
  );
}