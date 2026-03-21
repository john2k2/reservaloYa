import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Facebook, Instagram } from "lucide-react";

import { TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { BusinessHero } from "@/components/public/business-hero";
import { FaqContactSection } from "@/components/public/faq-contact-section";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { ServicesSection } from "@/components/public/services-section";
import { StickyHeader } from "@/components/public/sticky-header";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import {
  BreadcrumbJsonLd,
  LocalBusinessJsonLd,
  WebPageJsonLd,
} from "@/lib/seo/business-json-ld";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { generateBusinessMetadata } from "@/lib/seo/business-metadata";
import { cn } from "@/lib/utils";
import { getPublicBusinessPageData } from "@/server/queries/public";
import { productName } from "@/constants/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const pageData = await getPublicBusinessPageData(slug);

    if (!pageData) {
      return {
        title: "Negocio no encontrado | ReservaYa",
      };
    }

    return generateBusinessMetadata({
      businessName: pageData.business.name,
      slug,
      description: pageData.profile?.description,
      address: pageData.business.address,
      phone: pageData.business.phone,
      image: pageData.profile?.heroImageUrl || pageData.profile?.logoUrl,
      category: (pageData.profile as { category?: string })?.category,
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "ReservaYa | Turnos online para negocios chicos" };
  }
}

const demoServices = [
  {
    id: "22222222-2222-2222-2222-222222222221",
    name: "Corte clásico",
    priceLabel: "$ 12.000",
    description: "Corte con terminación prolija para uso diario.",
    durationMinutes: 45,
    popular: false,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Corte + barba",
    priceLabel: "$ 18.000",
    description: "Servicio completo con perfilado y terminación.",
    durationMinutes: 60,
    popular: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222223",
    name: "Perfilado premium",
    priceLabel: "$ 8.000",
    description: "Repaso rápido para mantener prolijo el look.",
    durationMinutes: 30,
    popular: false,
  },
];

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
};

function buildInstagramHref(handle?: string) {
  if (!handle) return null;
  if (handle.startsWith("http://") || handle.startsWith("https://")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

function buildFacebookHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://facebook.com/${value.replace(/^@/, "")}`;
}

function buildTikTokHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://www.tiktok.com/${value.startsWith("@") ? value : `@${value}`}`;
}

function buildWebsiteHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function buildWhatsAppHref(phone?: string, businessName?: string) {
  const normalizedPhone = phone?.replace(/\D/g, "");
  const message = businessName
    ? `Hola ${businessName}, quiero reservar un turno.`
    : "Hola, quiero reservar un turno.";

  if (!normalizedPhone) {
    return getSiteWhatsAppHref(message);
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function buildBookingHref(input: {
  slug: string;
  serviceId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}) {
  const params = new URLSearchParams();
  if (input.serviceId) params.set("service", input.serviceId);
  if (input.source) params.set("utm_source", input.source);
  if (input.medium) params.set("utm_medium", input.medium);
  if (input.campaign) params.set("utm_campaign", input.campaign);
  const query = params.toString();
  return query ? `/${input.slug}/reservar?${query}` : `/${input.slug}/reservar`;
}

function getStartingPriceLabel(
  services: Array<{
    priceLabel?: string;
    price?: number | null;
  }>
) {
  const pricedServices = services.filter(
    (service): service is { price: number; priceLabel: string } =>
      typeof service.price === "number" && Boolean(service.priceLabel)
  );

  if (pricedServices.length === 0) {
    return "Consulta personalizada";
  }

  const cheapestService = pricedServices.reduce((currentCheapest, service) =>
    service.price < currentCheapest.price ? service : currentCheapest
  );

  return `Desde ${cheapestService.priceLabel}`;
}

function getFirstActiveDayLabel(
  weeklyHours: Array<{
    dayLabel: string;
    hoursLabel: string;
  }>
) {
  return (
    weeklyHours.find((slot) => !slot.hoursLabel.toLocaleLowerCase("es-AR").includes("cerrado")) ??
    weeklyHours[0] ??
    null
  );
}

function getShortAddressLabel(address?: string | null) {
  if (!address) {
    return "Ubicación a confirmar";
  }

  const [firstSegment] = address.split(",");
  return firstSegment?.trim() || address;
}

function getNextAvailableSlotLabel(input?: {
  dayLabel: string;
  hoursLabel: string;
} | null) {
  if (!input) {
    return {
      title: "Agenda activa",
      detail: "Ver disponibilidad",
    };
  }

  return {
    title: input.dayLabel,
    detail: input.hoursLabel,
  };
}

export default async function BusinessPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params;
  const tracking = await searchParams;
  const pageData = await getPublicBusinessPageData(slug);

  if (!pageData) {
    notFound();
  }

  const services = (pageData.services.length > 0 ? pageData.services : demoServices).map(
    (service, index) => ({
      ...service,
      popular: Boolean("featured" in service ? service.featured : false) || index === 0,
      featureBadge:
        "featured" in service && service.featured
          ? service.featuredLabel || "Destacado"
          : index === 0
            ? "Más elegido"
            : "",
    })
  );

  const startingPriceLabel = getStartingPriceLabel(services);
  const firstActiveDay = getFirstActiveDayLabel(pageData.weeklyHours);
  const highlightedTestimonial = pageData.profile.testimonials[0] ?? null;
  const shortAddressLabel = getShortAddressLabel(pageData.business.address);
  const nextAvailableSlot = getNextAvailableSlotLabel(firstActiveDay);

  const whatsappHref = buildWhatsAppHref(pageData.business.phone, pageData.business.name);
  const instagramHref = buildInstagramHref(pageData.profile.instagram);
  const facebookHref = buildFacebookHref(pageData.profile.facebook);
  const tiktokHref = buildTikTokHref(pageData.profile.tiktok);
  const websiteHref = buildWebsiteHref(pageData.profile.website);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    pageData.business.address ?? pageData.profile.mapQuery ?? pageData.business.name
  )}`;
  const mapEmbedSrc =
    pageData.profile.mapEmbedUrl ??
    `https://www.google.com/maps?q=${encodeURIComponent(
      pageData.profile.mapQuery ?? pageData.business.address ?? pageData.business.name
    )}&output=embed`;

  const logoLabel =
    pageData.profile.logoLabel ??
    pageData.business.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("");

  const logoStyle = pageData.profile.logoUrl
    ? ({
        backgroundImage: `url(${pageData.profile.logoUrl})`,
      } as const)
    : undefined;

  const bookingHref = buildBookingHref({
    slug,
    source: tracking.utm_source,
    medium: tracking.utm_medium,
    campaign: tracking.utm_campaign,
  });

  // Preparar datos para JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reservaya.app";
  const businessUrl = `${siteUrl}/${slug}`;
  
  const openingHoursForJsonLd = pageData.weeklyHours
    .filter((h) => !h.hoursLabel.toLowerCase().includes("cerrado"))
    .map((h) => {
      const [opens, closes] = h.hoursLabel.split("-").map((t) => t.trim());
      return {
        day: h.dayLabel,
        opens: opens || "09:00",
        closes: closes || "18:00",
      };
    });

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
      {/* SEO: JSON-LD Structured Data */}
      <LocalBusinessJsonLd
        name={pageData.business.name}
        description={pageData.profile?.description || `Reserva tu turno en ${pageData.business.name}`}
        url={businessUrl}
        telephone={pageData.business.phone}
        address={pageData.business.address}
        image={pageData.profile?.heroImageUrl || pageData.profile?.logoUrl}
        openingHours={openingHoursForJsonLd}
        services={services.map((s) => s.name)}
      />
      <WebPageJsonLd
        name={pageData.business.name}
        description={pageData.profile?.description || `Reserva tu turno en ${pageData.business.name}`}
        url={businessUrl}
        image={pageData.profile?.heroImageUrl ?? undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: siteUrl },
          { name: pageData.business.name, url: businessUrl },
        ]}
      />

      <main
        id="main-content"
        className="min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
      >
        <StickyHeader
          businessSlug={slug}
          logoLabel={logoLabel}
          logoUrl={pageData.profile.logoUrl ?? undefined}
          businessName={pageData.business.name}
          bookingHref={bookingHref}
          whatsappHref={whatsappHref}
          accent={pageData.profile.accent}
          enableDarkMode={pageData.profile.enableDarkMode}
        />

        <BusinessHero
          slug={slug}
          businessName={pageData.business.name}
          profile={pageData.profile}
          bookingHref={bookingHref}
          whatsappHref={whatsappHref}
          websiteHref={websiteHref}
          instagramHref={instagramHref}
          facebookHref={facebookHref}
          tiktokHref={tiktokHref}
          mapsHref={mapsHref}
          logoLabel={logoLabel}
          nextAvailableSlot={nextAvailableSlot}
          servicesCount={services.length}
          startingPriceLabel={startingPriceLabel}
          shortAddressLabel={shortAddressLabel}
          firstActiveDay={firstActiveDay}
          highlightedTestimonial={highlightedTestimonial}
        />

        {/* Gallery */}
        {pageData.profile.gallery && pageData.profile.gallery.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
            <div className="mb-6 sm:mb-10 text-center">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Galería
              </p>
              <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Así se vive la experiencia del negocio
              </h2>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.profile.gallery.map((image, index) => (
                <article
                  key={`${image.url}-${index}`}
                  className={cn(
                    "group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/60 bg-card shadow-sm",
                    index >= pageData.profile.sectionLayout.mobileGalleryItems ? "hidden sm:block" : ""
                  )}
                  data-lightbox-index={index}
                >
                  <div
                    className="aspect-[4/3] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    role="img"
                    aria-label={image.alt}
                    style={{ backgroundImage: `url(${image.url})` }}
                  />
                  <div className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground">{image.alt}</p>
                  </div>
                </article>
              ))}
            </div>
            <GalleryLightbox images={pageData.profile.gallery} />
          </section>
        )}

        <ServicesSection
          slug={slug}
          accentColor={pageData.profile.accent}
          accentSoft={pageData.profile.accentSoft}
          surfaceTint={pageData.profile.surfaceTint}
          services={services}
          mobilePreviewCount={pageData.profile.sectionLayout.mobileServiceCards}
          bookingHrefForService={(serviceId) =>
            buildBookingHref({
              slug,
              serviceId,
              source: tracking.utm_source,
              medium: tracking.utm_medium,
              campaign: tracking.utm_campaign,
            })
          }
        />

        <TestimonialsSection
          accentColor={pageData.profile.accent}
          testimonials={pageData.profile.testimonials}
          mobileVisibleCount={pageData.profile.sectionLayout.mobileTestimonials}
        />

        {/* Horarios de atención */}
        {pageData.weeklyHours && pageData.weeklyHours.length > 0 && (
          <section className="border-t border-border/40 py-10 sm:py-14 lg:py-20" style={{ backgroundColor: pageData.profile.surfaceTint }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-8 sm:mb-10 text-center">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                  Horarios
                </p>
                <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Días y horarios de atención
                </h2>
              </div>
              <div className="mx-auto max-w-sm sm:max-w-md">
                <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-background shadow-sm">
                  {pageData.weeklyHours.map((slot, idx) => {
                    const isClosed = slot.hoursLabel.toLowerCase().includes("cerrado");
                    return (
                      <div
                        key={slot.dayLabel}
                        className={cn(
                          "flex items-center justify-between px-5 py-3.5 text-sm",
                          idx !== 0 && "border-t border-border/40",
                          isClosed && "opacity-50"
                        )}
                      >
                        <span className="font-medium text-foreground">{slot.dayLabel}</span>
                        <span className={cn("text-right", isClosed ? "text-muted-foreground" : "font-semibold")} style={isClosed ? undefined : { color: pageData.profile.accent }}>
                          {slot.hoursLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <FaqContactSection
          accentColor={pageData.profile.accent}
          surfaceTint={pageData.profile.surfaceTint}
          faqs={pageData.profile.faqs}
          policies={[
            ...(pageData.business.cancellationPolicy ? [pageData.business.cancellationPolicy] : []),
            ...pageData.profile.policies,
          ]}
          whatsappHref={whatsappHref}
          instagramHref={instagramHref}
          facebookHref={facebookHref}
          tiktokHref={tiktokHref}
          mobileFaqCount={pageData.profile.sectionLayout.mobileFaqItems}
          mobilePolicyCount={pageData.profile.sectionLayout.mobilePolicyItems}
        />

        {/* Location */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
          <div className="mb-4 sm:mb-6 text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
              Ubicación
            </p>
            <h2 className="mt-2 sm:mt-3 text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {pageData.business.address ?? "Dirección a definir"}
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/60 shadow-sm">
            <iframe
              title={`Mapa de ${pageData.business.name}`}
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-48 sm:h-64 lg:h-80 w-full"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-background py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-9 sm:size-10 items-center justify-center rounded-lg sm:rounded-xl border border-border/60 bg-background text-xs sm:text-sm font-bold text-foreground shadow-sm",
                      pageData.profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
                    )}
                    style={logoStyle}
                  >
                    {logoLabel}
                  </div>
                  <span className="font-bold text-foreground text-sm sm:text-base">{pageData.business.name}</span>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {pageData.profile.description.slice(0, 100)}...
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">Links rápidos</p>
                <div className="mt-3 sm:mt-4 flex flex-col gap-1.5">
                  <PublicTrackedLink
                    businessSlug={slug}
                    eventName="booking_cta_clicked"
                    href={bookingHref}
                    pagePath={`/${slug}`}
                    className="inline-flex min-h-9 sm:min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Reservar turno
                  </PublicTrackedLink>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 sm:min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                      Contactar por WhatsApp
                  </a>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 sm:min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                      Ver ubicación
                  </a>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-xs sm:text-sm font-bold text-foreground">Contacto</p>
                <div className="mt-3 sm:mt-4 space-y-1.5">
                  <p className="text-xs sm:text-sm text-muted-foreground">{pageData.business.address ?? "Dirección a definir"}</p>
                  <div className="flex flex-wrap gap-2">
                    {instagramHref && (
                      <a
                        href={instagramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Instagram className="size-3.5 sm:size-4" />
                      </a>
                    )}
                    {facebookHref && (
                      <a
                        href={facebookHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Facebook className="size-3.5 sm:size-4" />
                      </a>
                    )}
                    {tiktokHref && (
                      <a
                        href={tiktokHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <TikTokIcon className="size-3.5 sm:size-4" />
                      </a>
                    )}
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <WhatsAppIcon className="size-3.5 sm:size-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:pt-8 sm:flex-row">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
                © {new Date().getFullYear()} {pageData.business.name}. Todos los derechos reservados.
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                Desarrollado con <span className="font-bold text-foreground">{productName}</span>
              </p>
            </div>
          </div>
        </footer>

        <PublicAnalyticsTracker businessSlug={slug} eventName="public_page_view" pagePath={`/${slug}`} />
      </main>
    </PublicBusinessPageWrapper>
  );
}





