import Link from "next/link";
import { Clock3 } from "lucide-react";

type BookingServicePickerProps = {
  accentColor: string;
  heading: string;
  description: string;
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceLabel: string;
  }>;
  getHref: (serviceId: string) => string;
};

export function BookingServicePicker({
  accentColor,
  heading,
  description,
  services,
  getHref,
}: BookingServicePickerProps) {
  return (
    <div className="mb-12">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{heading}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-col gap-3">
        {services.map((service) => (
          <Link
            key={service.id}
            href={getHref(service.id)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:scale-[1.01] hover:border-foreground/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-card-foreground group-hover:text-foreground">
                  {service.name}
                </p>
                <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-3.5" />
                    {service.durationMinutes} min
                  </span>
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-sm font-bold"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                {service.priceLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
