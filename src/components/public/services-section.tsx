import { Scissors, Star } from "lucide-react";

import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type ServiceCard = {
  id: string;
  name: string;
  priceLabel: string;
  description: string;
  durationMinutes: number;
  popular: boolean;
  featureBadge: string;
};

type ServicesSectionProps = {
  slug: string;
  accentColor: string;
  accentSoft: string;
  surfaceTint: string;
  bookingHrefForService: (serviceId: string) => string;
  services: ServiceCard[];
};

export function ServicesSection({
  slug,
  accentColor,
  accentSoft,
  surfaceTint,
  bookingHrefForService,
  services,
}: ServicesSectionProps) {
  return (
    <section className="border-y border-border/40 py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              Servicios
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Elegí el turno que mejor encaja con tu agenda
            </h2>
          </div>
          <span className="hidden text-sm font-semibold uppercase tracking-widest text-muted-foreground sm:block">
            {services.length} opciones
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className={cn(
                "relative flex h-full flex-col rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg",
                service.popular ? "border-2 bg-background" : "border-border/60 bg-background/80"
              )}
              style={service.popular ? { borderColor: accentColor } : undefined}
            >
              {service.popular && (
                <div
                  className="absolute -top-3 left-6 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Star className="size-3 fill-current" />
                  {service.featureBadge}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-card-foreground">{service.name}</h3>
                <span
                  className="rounded-full px-3 py-1.5 text-sm font-bold"
                  style={{
                    backgroundColor: accentSoft,
                    color: accentColor,
                  }}
                >
                  {service.priceLabel}
                </span>
              </div>

              <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                {service.description}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Scissors className="size-4" style={{ color: accentColor }} />
                <span>{service.durationMinutes} min</span>
              </div>

              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHrefForService(service.id)}
                pagePath={`/${slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "mt-6 h-12 rounded-full font-semibold transition-transform hover:scale-[1.02]",
                  service.popular ? "" : "bg-foreground hover:bg-foreground/90"
                )}
                style={service.popular ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
              >
                Reservar este servicio
              </PublicTrackedLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
