import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { BusinessFooter } from "@/components/public/business-footer";
import { BusinessHero } from "@/components/public/business-hero";
import { FaqContactSection } from "@/components/public/faq-contact-section";
import { HoursLocationSection } from "@/components/public/hours-location-section";
import {
  PublicGallerySection,
  PublicGallerySectionSkeleton,
} from "@/components/public/public-gallery-section";
import { ReviewsSection } from "@/components/public/reviews-section";
import { ServicesSection } from "@/components/public/services-section";
import { StickyHeader } from "@/components/public/sticky-header";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { isDemoBusiness } from "@/constants/demo";
import { resolvePublicTrustPoints } from "@/constants/public-business-profiles";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import {
  BreadcrumbJsonLd,
  FAQJsonLd,
  LocalBusinessJsonLd,
  ServiceJsonLd,
  WebPageJsonLd,
  resolveLocalBusinessSchemaType,
} from "@/lib/seo/business-json-ld";
import {
  filterPricedServices,
  getFirstActiveDayLabel,
  getNextAvailableSlotLabel,
  getPriceRangeSymbol,
  getShortAddressLabel,
  getStartingPriceLabel,
} from "@/lib/public-business-display";
import {
  buildBookingHref,
  buildFacebookHref,
  buildInstagramHref,
  buildTikTokHref,
  buildWhatsAppHref,
} from "@/lib/business-profile-links";
import { getPublicAppUrl } from "@/lib/runtime";
import { generateBusinessMetadata } from "@/lib/seo/business-metadata";
import { getPublicBusinessPageData } from "@/server/queries/public";
import { createLogger } from "@/server/logger";

const logger = createLogger("Public Page");

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let pageData: Awaited<ReturnType<typeof getPageData>>;

  try {
    pageData = await getPageData(slug);
  } catch (error) {
    logger.error("Error generating metadata:", error);
    return {
      title: { absolute: "ReservaYa | Turnos online para negocios chicos" },
      robots: { index: false, follow: false },
    };
  }

  if (!pageData) notFound();

  const metadata = generateBusinessMetadata({
    businessName: pageData.business.name,
    slug,
    description: pageData.profile?.description,
    address: pageData.business.address,
    phone: pageData.business.phone,
  });

  if (isDemoBusiness(slug)) {
    return {
      ...metadata,
      robots: { index: false, follow: true },
    };
  }

  return metadata;
}

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
};

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

  const pricedServices = filterPricedServices(services);
  const startingPriceLabel = getStartingPriceLabel(pricedServices);
  const priceRangeSymbol = getPriceRangeSymbol(pricedServices);
  const firstActiveDay = getFirstActiveDayLabel(pageData.weeklyHours);
  // Template testimonials are invented showcase content -- only the demo
  // businesses themselves show them. Real businesses show real reviews
  // (rendered further below) instead.
  const isDemo = isDemoBusiness(slug);
  const highlightedTestimonial = isDemo ? pageData.profile.testimonials[0] ?? null : null;
  const shortAddressLabel = getShortAddressLabel(pageData.business.address);
  const nextAvailableSlot = getNextAvailableSlotLabel(firstActiveDay);

  // Demo pages keep template trust chips. Real businesses hide template
  // defaults and only show trust points when branding customized them.
  const heroProfile = {
    ...pageData.profile,
    trustPoints: resolvePublicTrustPoints({
      isDemo,
      profileTrustPoints: pageData.profile.trustPoints,
      businessSlug: pageData.business.slug,
      businessName: pageData.business.name,
      templateSlug: pageData.profile.templateKey,
      shortAddressLabel,
    }),
  };

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

  const bookingHref = buildBookingHref({
    slug,
    source: tracking.utm_source,
    medium: tracking.utm_medium,
    campaign: tracking.utm_campaign,
  });

  const hasGallery =
    Boolean(pageData.profile.instagramGallery && pageData.profile.instagramGallery.length > 0) ||
    Boolean(pageData.profile.gallery && pageData.profile.gallery.length > 0);

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

  // Extraer coordenadas de mapQuery si existen
  let geo: { latitude: number; longitude: number } | undefined;
  const mapQuery = pageData.profile.mapQuery;
  if (mapQuery) {
    const coordMatch = mapQuery.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = Number(coordMatch[1]);
      const lng = Number(coordMatch[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        geo = { latitude: lat, longitude: lng };
      }
    }
  }

  const reviewsForJsonLd =
    pageData.reviews?.map((review) => ({
      author: review.customerName,
      reviewRating: review.rating,
      reviewBody: review.comment,
      datePublished: review.created,
    })) ?? [];

  const aggregateRating =
    pageData.reviews && pageData.reviews.length > 0
      ? {
          ratingValue:
            Math.round(
              (pageData.reviews.reduce((sum, r) => sum + r.rating, 0) /
                pageData.reviews.length) *
                10
            ) / 10,
          reviewCount: pageData.reviews.length,
        }
      : undefined;

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
      {/* SEO: JSON-LD Structured Data */}
      <LocalBusinessJsonLd
        name={pageData.business.name}
        description={pageData.profile?.description || `Reservá tu turno en ${pageData.business.name}`}
        url={businessUrl}
        businessType={resolveLocalBusinessSchemaType(pageData.profile?.templateKey)}
        telephone={pageData.business.phone}
        address={pageData.business.address}
        image={pageData.profile?.heroImageUrl || pageData.profile?.logoUrl}
        priceRange={priceRangeSymbol}
        openingHours={openingHoursForJsonLd}
        geo={geo}
        services={services.map((s) => s.name)}
        rating={aggregateRating}
        reviews={reviewsForJsonLd}
      />
      <WebPageJsonLd
        name={pageData.business.name}
        description={pageData.profile?.description || `Reservá tu turno en ${pageData.business.name}`}
        url={businessUrl}
        image={pageData.profile?.heroImageUrl ?? undefined}
      />
      {services.map((service) => (
        <ServiceJsonLd
          key={service.id}
          businessName={pageData.business.name}
          businessUrl={businessUrl}
          serviceName={service.name}
          description={service.description}
          price={typeof service.price === "number" ? service.price : null}
          duration={`PT${service.durationMinutes}M`}
        />
      ))}
      {pageData.profile.faqs && pageData.profile.faqs.length > 0 && (
        <FAQJsonLd
          faqs={pageData.profile.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: siteUrl },
          { name: pageData.business.name, url: businessUrl },
        ]}
      />

      <main
        id="main-content"
        className="min-h-screen scroll-pt-20 bg-background font-sans text-foreground selection:bg-foreground selection:text-background sm:scroll-pt-24"
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
          profile={heroProfile}
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

        {/* Gallery — streameada: el fetch de Instagram (oEmbed) no bloquea hero + servicios */}
        {hasGallery && (
          <Suspense
            fallback={
              <PublicGallerySectionSkeleton
                mobileGalleryItems={pageData.profile.sectionLayout.mobileGalleryItems}
              />
            }
          >
            <PublicGallerySection
              businessName={pageData.business.name}
              accent={pageData.profile.accent}
              mobileGalleryItems={pageData.profile.sectionLayout.mobileGalleryItems}
              gallery={pageData.profile.gallery}
              instagramGallery={pageData.profile.instagramGallery}
            />
          </Suspense>
        )}

        {pageData.reviews && pageData.reviews.length > 0 && (
          <ReviewsSection accentColor={pageData.profile.accent} reviews={pageData.reviews} />
        )}

        {isDemo && (
          <TestimonialsSection
            accentColor={pageData.profile.accent}
            testimonials={pageData.profile.testimonials}
            mobileVisibleCount={pageData.profile.sectionLayout.mobileTestimonials}
          />
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

        <HoursLocationSection
          accentColor={pageData.profile.accent}
          surfaceTint={pageData.profile.surfaceTint}
          weeklyHours={pageData.weeklyHours}
          businessName={pageData.business.name}
          address={pageData.business.address}
          mapEmbedSrc={mapEmbedSrc}
        />

        <BusinessFooter
          slug={slug}
          businessName={pageData.business.name}
          description={pageData.profile.description}
          logoUrl={pageData.profile.logoUrl}
          logoLabel={logoLabel}
          bookingHref={bookingHref}
          whatsappHref={whatsappHref}
          mapsHref={mapsHref}
          address={pageData.business.address}
          instagramHref={instagramHref}
          facebookHref={facebookHref}
          tiktokHref={tiktokHref}
        />

        <PublicAnalyticsTracker businessSlug={slug} eventName="public_page_view" pagePath={`/${slug}`} />
      </main>
    </PublicBusinessPageWrapper>
  );
}



