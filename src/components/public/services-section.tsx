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
  mobilePreviewCount?: number;
};

export function ServicesSection({
  slug,
  accentColor,
  accentSoft,
  surfaceTint,
  bookingHrefForService,
  services,
  mobilePreviewCount = 4,
}: ServicesSectionProps) {
  const hiddenOnMobile = Math.max(services.length - mobilePreviewCount, 0);

  return (
    <section className="border-y border-border/40 py-12 sm:py-16 lg:py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: accentColor }}>
              Servicios
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-2xl lg:text-3xl">
              Elegí el turno que mejor encaja con tu agenda
            </h2>
          </div>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:block sm:text-sm">
            {services.length} opciones
          </span>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-4 shadow-sm transition-all hover:shadow-lg sm:rounded-3xl sm:p-6",
                index >= mobilePreviewCount ? "hidden sm:flex" : "",
                service.popular ? "border-2 bg-background" : "border-border/60 bg-background/80"
              )}
              style={service.popular ? { borderColor: accentColor } : undefined}
            >
              {service.popular && (
                <div
                  className="absolute left-4 -top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:-top-3 sm:left-6 sm:px-3 sm:py-1 sm:text-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  <Star className="size-2.5 fill-current sm:size-3" />
                  {service.featureBadge}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <h3 className="text-base font-bold text-card-foreground sm:text-xl">{service.name}</h3>
                <span
                  className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold sm:px-3 sm:py-1.5 sm:text-sm"
                  style={{ backgroundColor: accentSoft, color: accentColor }}
                >
                  {service.priceLabel}
                </span>
              </div>

              <p className="mt-3 flex-1 text-xs leading-5 text-muted-foreground sm:mt-4 sm:text-sm sm:leading-6">
                {service.description}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground sm:mt-5 sm:text-sm">
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
                  "mt-4 h-10 rounded-full text-xs font-semibold transition-transform hover:scale-[1.02] sm:mt-6 sm:h-12 sm:text-sm",
                  service.popular ? "" : "bg-foreground hover:bg-foreground/90"
                )}
                style={service.popular ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
              >
                Reservar este servicio
              </PublicTrackedLink>
            </article>
          ))}
        </div>

        {hiddenOnMobile > 0 ? (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/85 p-4 text-center shadow-sm sm:hidden">
            <p className="text-sm font-medium text-foreground">+ {hiddenOnMobile} servicios más disponibles dentro del flujo de reserva.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
