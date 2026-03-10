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
    <section className="border-y border-border/40 py-12 sm:py-16 lg:py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 sm:mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              Servicios
            </p>
            <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Elegí el turno que mejor encaja con tu agenda
            </h2>
          </div>
          <span className="hidden text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground sm:block">
            {services.length} opciones
          </span>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm transition-all hover:shadow-lg",
                service.popular ? "border-2 bg-background" : "border-border/60 bg-background/80"
              )}
              style={service.popular ? { borderColor: accentColor } : undefined}
            >
              {service.popular && (
                <div
                  className="absolute -top-2 sm:-top-3 left-4 sm:left-6 flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Star className="size-2.5 sm:size-3 fill-current" />
                  {service.featureBadge}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <h3 className="text-base sm:text-xl font-bold text-card-foreground">{service.name}</h3>
                <span
                  className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap"
                  style={{
                    backgroundColor: accentSoft,
                    color: accentColor,
                  }}
                >
                  {service.priceLabel}
                </span>
              </div>

              <p className="mt-3 sm:mt-4 flex-1 text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
                {service.description}
              </p>

              <div className="mt-4 sm:mt-5 flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <Scissors className="size-3.5 sm:size-4" style={{ color: accentColor }} />
                <span>{service.durationMinutes} min</span>
              </div>

              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHrefForService(service.id)}
                pagePath={`/${slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "mt-4 sm:mt-6 h-10 sm:h-12 rounded-full font-semibold transition-transform hover:scale-[1.02] text-xs sm:text-sm",
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
