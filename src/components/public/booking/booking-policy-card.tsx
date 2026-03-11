import { CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type BookingPolicyCardProps = {
  className?: string;
};

const bookingPolicies = [
  "Puedes cancelar o reprogramar hasta 24 hs antes.",
  "Si el negocio activa recordatorios, te avisaremos por el canal configurado.",
  "Llega 10 minutos antes para aprovechar completo tu horario.",
];

export function BookingPolicyCard({ className }: BookingPolicyCardProps) {
  return (
    <section className={cn("rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6", className)}>
      <div className="flex items-start gap-3">
        <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Antes de confirmar
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">Politicas de la reserva</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Todo lo importante, resumido y claro para que no haya sorpresas.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {bookingPolicies.map((policy, index) => (
          <div
            key={policy}
            className="flex gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground"
          >
            {index === 1 ? (
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-foreground" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
            )}
            <span>{policy}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
