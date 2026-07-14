import { SelloStamp } from "./sello-stamp";

/**
 * Talón de turno — artefacto visual del hero.
 * Primera aparición del motivo agenda/ticket/sello (también en Pricing y
 * TimeCalculator vía SelloStamp / stampHit). Datos de ejemplo, no de un turno real.
 */
export function TicketStub() {
  return (
    <div
      className="relative w-full max-w-[280px] rounded-2xl border border-rule bg-card shadow-xl"
      style={{ transform: "rotate(-3deg)" }}
      role="img"
      aria-label="Talón de ejemplo: turno número 001 en Barbería clásica, hoy a las 14:30, confirmado"
    >
      <div className="flex items-center justify-between border-b border-dashed border-rule px-5 py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Turno
        </span>
        <span className="font-mono text-lg font-bold text-foreground">#001</span>
      </div>

      <div className="space-y-3 px-5 py-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Negocio</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Barbería clásica</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Hoy</p>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground">14:30</p>
        </div>
      </div>

      <div className="flex justify-center border-t border-dashed border-rule px-5 py-4">
        <SelloStamp label="Confirmado" rotate={-6} />
      </div>

      <div className="pointer-events-none absolute -left-3 top-[60px] size-6 rounded-full bg-background" />
      <div className="pointer-events-none absolute -right-3 top-[60px] size-6 rounded-full bg-background" />
    </div>
  );
}
