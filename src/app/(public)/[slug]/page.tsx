import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Facebook, Instagram } from "lucide-react";

import { TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
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
import { getPublicAppUrl } from "@/lib/runtime";
import { generateBusinessMetadata } from "@/lib/seo/business-metadata";
import { cn } from "@/lib/utils";
import { getPublicBusinessPageData } from "@/server/queries/public";
import { fetchInstagramGallery } from "@/lib/instagram-oembed";
import { productName } from "@/constants/site";

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const pageData = await getPageData(slug);

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


function buildWhatsAppHref(phone?: string, businessName?: string): string | undefined {
  const normalizedPhone = phone?.replace(/\D/g, "");
  if (!normalizedPhone) return undefined;

  const message = businessName
    ? `Hola ${businessName}, quiero reservar un turno.`
    : "Hola, quiero reservar un turno.";

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

function getGalleryAlt(input: {
  alt?: string | null;
  businessName: string;
  index: number;
  source: "instagram" | "gallery";
}) {
  const alt = input.alt?.trim();

  if (alt) {
    return alt;
  }

  return input.source === "instagram"
    ? `Foto ${input.index + 1} de ${input.businessName} en Instagram`
    : `Foto ${input.index + 1} de ${input.businessName}`;
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
  const pageData = await getPageData(slug);

  if (!pageData) {
    notFound();
  }

  const services = pageData.services.map((service, index) => ({
    ...service,
    popular: Boolean(service.featured) || index === 0,
    featureBadge: service.featured
      ? service.featuredLabel || "Destacado"
      : index === 0
        ? "Más elegido"
        : "",
  }));

  const startingPriceLabel = getStartingPriceLabel(services);
  const firstActiveDay = getFirstActiveDayLabel(pageData.weeklyHours);
  const highlightedTestimonial = pageData.profile.testimonials[0] ?? null;
  const shortAddressLabel = getShortAddressLabel(pageData.business.address);
  const nextAvailableSlot = getNextAvailableSlotLabel(firstActiveDay);

  const whatsappHref = buildWhatsAppHref(pageData.business.phone, pageData.business.name);
  const instagramHref = buildInstagramHref(pageData.profile.instagram);
  const facebookHref = buildFacebookHref(pageData.profile.facebook);
  const tiktokHref = buildTikTokHref(pageData.profile.tiktok);
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

  const instagramGalleryItems =
    pageData.profile.instagramGallery && pageData.profile.instagramGallery.length > 0
      ? await fetchInstagramGallery(pageData.profile.instagramGallery)
      : [];
  const galleryItems =
    instagramGalleryItems.length > 0
      ? instagramGalleryItems.map((item, index) => ({
          url: item.thumbnailUrl,
          alt: getGalleryAlt({
            businessName: pageData.business.name,
            index,
            source: "instagram",
          }),
          postUrl: item.postUrl,
        }))
      : (pageData.profile.gallery ?? []).map((item, index) => ({
          ...item,
          alt: getGalleryAlt({
            alt: item.alt,
            businessName: pageData.business.name,
            index,
            source: "gallery",
          }),
          postUrl: null,
        }));

  // Preparar datos para JSON-LD
  const siteUrl = getPublicAppUrl();
  const businessUrl = `${siteUrl}/${slug}`;

  // hoursLabel tiene formato "09:00 a 18:00" y puede tener múltiples
  // franjas separadas por " · " (ej: "09:00 a 12:00 · 14:00 a 18:00")
  const openingHoursForJsonLd = pageData.weeklyHours
    .filter((h) => !h.hoursLabel.toLowerCase().includes("cerrado"))
    .flatMap((h) =>
      h.hoursLabel.split(" · ").map((window) => {
        const [opens, closes] = window.split(" a ").map((t) => t.trim());
        return {
          day: h.dayLabel,
          opens: opens || "09:00",
          closes: closes || "18:00",
        };
      })
    );

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

        {/* Gallery */}
        {galleryItems.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
            <div className="mb-6 sm:mb-10 text-center">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Galería
              </p>
              <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Así se vive la experiencia del negocio
              </h2>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryItems.map((image, index) => {
                const inner = (
                  <>
                    <div
                      className="aspect-[4/3] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      role="img"
                      aria-label={image.alt || `Foto ${index + 1}`}
                      style={{ backgroundImage: `url(${image.url})` }}
                    />
                    {image.alt && (
                      <div className="p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">{image.alt}</p>
                      </div>
                    )}
                  </>
                );
                const className = cn(
                  "group overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border/60 bg-card shadow-sm",
                  index >= pageData.profile.sectionLayout.mobileGalleryItems ? "hidden sm:block" : ""
                );
                return image.postUrl ? (
                  <a
                    key={`${image.url}-${index}`}
                    href={image.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(className, "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
                    aria-label={`Abrir foto ${index + 1} de ${pageData.business.name} en Instagram`}
                  >
                    {inner}
                  </a>
                ) : (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    className={cn(className, "cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background")}
                    aria-label={`Abrir foto ${index + 1} de ${pageData.business.name}`}
                    data-lightbox-index={index}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
            {instagramGalleryItems.length === 0 && (
              <GalleryLightbox images={galleryItems} />
            )}
          </section>
        )}

        {pageData.reviews && pageData.reviews.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
            <div className="mb-6 sm:mb-10 text-center">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Reseñas
              </p>
              <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Lo que dicen nuestros clientes
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.reviews.map((review, index) => (
                <article key={index} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="size-4" viewBox="0 0 20 20" fill={i < review.rating ? pageData.profile.accent : "#e5e7eb"}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{review.comment}</p>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">{review.customerName}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <TestimonialsSection
          accentColor={pageData.profile.accent}
          testimonials={pageData.profile.testimonials}
          mobileVisibleCount={pageData.profile.sectionLayout.mobileTestimonials}
        />

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

        {/* Horarios + Ubicación */}
        <section className="border-t border-border/40 py-10 sm:py-14 lg:py-20" style={{ backgroundColor: pageData.profile.surfaceTint }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">

              {/* Horarios */}
              {pageData.weeklyHours && pageData.weeklyHours.length > 0 && (
                <div>
                  <div className="mb-6">
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                      Horarios
                    </p>
                    <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                      Días y horarios de atención
                    </h2>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
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
              )}

              {/* Ubicación */}
              <div className={pageData.weeklyHours && pageData.weeklyHours.length > 0 ? "" : "lg:col-span-2"}>
                <div className="mb-6">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                    Ubicación
                  </p>
                  <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                    {pageData.business.address ?? "Dirección a definir"}
                  </h2>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
                  <iframe
                    title={`Mapa de ${pageData.business.name}`}
                    src={mapEmbedSrc}
                    width="640"
                    height="320"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 sm:h-72 lg:h-80 w-full"
                  />
                </div>
              </div>

            </div>
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
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 sm:min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Contactar por WhatsApp
                    </a>
                  )}
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
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`Abrir Instagram de ${pageData.business.name}`}
                      >
                        <Instagram className="size-3.5 sm:size-4" aria-hidden="true" />
                      </a>
                    )}
                    {facebookHref && (
                      <a
                        href={facebookHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`Abrir Facebook de ${pageData.business.name}`}
                      >
                        <Facebook className="size-3.5 sm:size-4" aria-hidden="true" />
                      </a>
                    )}
                    {tiktokHref && (
                      <a
                        href={tiktokHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`Abrir TikTok de ${pageData.business.name}`}
                      >
                        <TikTokIcon className="size-3.5 sm:size-4" aria-hidden="true" />
                      </a>
                    )}
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`Contactar a ${pageData.business.name} por WhatsApp`}
                      >
                        <WhatsAppIcon className="size-3.5 sm:size-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:pt-8 sm:flex-row">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                © {new Date().getFullYear()} {pageData.business.name}. Todos los derechos reservados.
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Desarrollado con <ReservaYaLogo variant="isotype" size="sm" className="size-4" />
                <span className="font-bold text-foreground">{productName}</span>
              </p>
            </div>
          </div>
        </footer>

        <PublicAnalyticsTracker businessSlug={slug} eventName="public_page_view" pagePath={`/${slug}`} />
      </main>
    </PublicBusinessPageWrapper>
  );
}




