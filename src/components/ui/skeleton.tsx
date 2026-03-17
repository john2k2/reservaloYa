import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "circle" | "avatar";
  lines?: number;
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-muted rounded-md";
  
  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    text: "h-4 w-3/4",
    circle: "h-12 w-12 rounded-full",
    avatar: "h-10 w-10 rounded-full",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? "w-1/2" : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <Skeleton variant="circle" className="mb-4" />
      <Skeleton variant="text" className="mb-2 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonServiceCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[1.5rem] border border-border/70 bg-background/85 p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton variant="text" className="mb-4 h-6 w-2/3" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
      </div>
      <Skeleton variant="text" className="mt-5 w-full" />
    </div>
  );
}

export function SkeletonSchedule({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Calendario */}
      <Skeleton variant="card" className="h-80" />
      
      {/* Horarios */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBookingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton variant="circle" className="h-10 w-10" />
        <Skeleton variant="text" className="w-40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        {/* Columna principal */}
        <div className="space-y-6">
          {/* Hero */}
          <Skeleton variant="card" className="h-40" />
          
          {/* Servicio seleccionado */}
          <Skeleton variant="card" className="h-32" />
          
          {/* Calendario */}
          <SkeletonSchedule />
          
          {/* Formulario */}
          <Skeleton variant="card" className="h-80" />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    </div>
  );
}
