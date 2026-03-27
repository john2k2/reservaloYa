import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const bookingSteps = [
  { id: 1, label: "Servicio", helper: "Que quieres reservar" },
  { id: 2, label: "Fecha y datos", helper: "Horario y tus datos" },
  { id: 3, label: "Confirmación", helper: "Reserva lista" },
] as const;

type BookingStepsHeaderProps = {
  backHref: string;
  currentStep?: 1 | 2 | 3;
  accentColor?: string;
};

export function BookingStepsHeader({
  backHref,
  currentStep = 1,
  accentColor,
}: BookingStepsHeaderProps) {
  return (
    <div className="mb-6 space-y-4 sm:mb-8">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al negocio
      </Link>

      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Reserva guiada
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
              Completa tu turno en 3 pasos simples
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">Paso {currentStep} de 3</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {bookingSteps.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition-colors",
                  isCurrent
                    ? "border-transparent bg-secondary/70 text-foreground"
                    : isCompleted
                      ? "border-border/60 bg-background text-foreground"
                      : "border-border/60 bg-background/70 text-muted-foreground"
                )}
                style={
                  isCurrent && accentColor
                    ? {
                        backgroundColor: `${accentColor}12`,
                        borderColor: `${accentColor}33`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isCurrent || isCompleted
                        ? "bg-foreground text-background"
                        : "bg-secondary text-foreground"
                    )}
                    style={
                      isCurrent && accentColor
                        ? { backgroundColor: accentColor, color: "#ffffff" }
                        : undefined
                    }
                  >
                    {step.id}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.helper}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
