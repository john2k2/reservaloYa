import { Clock3 } from "lucide-react";

type BookingSelectedServiceCardProps = {
  accentColor: string;
  service: {
    name: string;
    durationMinutes: number;
    priceLabel: string;
  };
};

export function BookingSelectedServiceCard({
  accentColor,
  service,
}: BookingSelectedServiceCardProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg">
      <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-lg">
            <Clock3 className="size-8 text-foreground" style={{ color: accentColor }} />
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-bold text-card-foreground">{service.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <Clock3 aria-hidden="true" className="size-4" />
            {service.durationMinutes} min
          </span>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-foreground">
            {service.priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
