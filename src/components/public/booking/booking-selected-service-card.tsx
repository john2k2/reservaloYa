import Link from "next/link";
import { CheckCircle2, CircleDollarSign, Clock3 } from "lucide-react";

type BookingSelectedServiceCardProps = {
  accentColor: string;
  service: {
    name: string;
    durationMinutes: number;
    priceLabel: string;
  };
  paymentMode?: "mercadopago" | "cash" | "none";
  changeHref?: string;
};

export function BookingSelectedServiceCard({
  accentColor,
  service,
  paymentMode = "none",
  changeHref,
}: BookingSelectedServiceCardProps) {
  const reservaLabel =
    paymentMode === "mercadopago"
      ? "Pago online"
      : paymentMode === "cash"
        ? "Pago en el local"
        : "Confirmación inmediata";
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Servicio elegido
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
            {service.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ya tenés el servicio listo. Ahora solo falta elegir una fecha y un horario publicado.
          </p>
        </div>

        {changeHref ? (
          <Link
            href={changeHref}
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-border/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Cambiar servicio
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
          <Clock3 aria-hidden="true" className="size-4" style={{ color: accentColor }} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Duración
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{service.durationMinutes} min</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
          <CircleDollarSign aria-hidden="true" className="size-4" style={{ color: accentColor }} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Precio
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{service.priceLabel}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
          <CheckCircle2 aria-hidden="true" className="size-4" style={{ color: accentColor }} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Reserva
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{reservaLabel}</p>
        </div>
      </div>
    </section>
  );
}
