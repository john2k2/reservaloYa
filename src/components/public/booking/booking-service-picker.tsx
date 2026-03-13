"use client";

import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type BookingServicePickerProps = {
  businessSlug: string;
  accentColor: string;
  heading: string;
  description: string;
  prefetchDate: string;
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceLabel: string;
  }>;
  getHref: (serviceId: string) => string;
};

export function BookingServicePicker({
  businessSlug,
  accentColor,
  heading,
  description,
  prefetchDate,
  services,
  getHref,
}: BookingServicePickerProps) {
  const router = useRouter();
  const prefetchedKeys = useRef(new Set<string>());

  const prefetchService = (serviceId: string) => {
    const cacheKey = `${serviceId}:${prefetchDate}`;

    if (prefetchedKeys.current.has(cacheKey)) {
      return;
    }

    prefetchedKeys.current.add(cacheKey);

    const href = getHref(serviceId);
    router.prefetch(href);

    void fetch(
      `/api/public/booking-slots?slug=${encodeURIComponent(businessSlug)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(prefetchDate)}`,
      {
        method: "GET",
        cache: "force-cache",
      }
    ).catch(() => {
      prefetchedKeys.current.delete(cacheKey);
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Paso 1
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {heading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {services.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-background/85 p-5 text-sm text-muted-foreground">
          Este negocio todavia no cargo servicios activos para reservar online.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Link
            key={service.id}
            href={getHref(service.id)}
            prefetch
            onMouseEnter={() => prefetchService(service.id)}
            onFocus={() => prefetchService(service.id)}
            onTouchStart={() => prefetchService(service.id)}
            className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ backgroundColor: accentColor }}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-card-foreground group-hover:text-foreground">
                  {service.name}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {service.durationMinutes} min
                  </span>
                  <span
                    className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
                  >
                    {service.priceLabel}
                  </span>
                </div>
              </div>

              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground">
                <ChevronRight className="size-4" />
              </span>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Elegir este servicio y ver horarios disponibles.
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
