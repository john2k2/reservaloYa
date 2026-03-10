import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BookingStepsHeaderProps = {
  backHref: string;
};

export function BookingStepsHeader({ backHref }: BookingStepsHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        href={backHref}
        className="mb-6 inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al inicio
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
          <span className="flex size-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-foreground">
            1
          </span>
          Servicio
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
            2
          </span>
          Fecha y hora
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
            3
          </span>
          Datos
        </div>
      </div>
    </div>
  );
}
