"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Algo salió mal",
  message = "Hubo un error al cargar el contenido. Por favor, intentá nuevamente.",
  onRetry,
  showHome = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h3>
      
      <p className="mb-6 max-w-sm text-muted-foreground">
        {message}
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
        )}
        
        {showHome && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-secondary/30 p-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          {icon}
        </div>
      )}
      
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h3>
      
      {description && (
        <p className="mb-6 max-w-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  );
}
