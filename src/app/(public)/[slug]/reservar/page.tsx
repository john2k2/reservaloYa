import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { RefreshCcw } from "lucide-react";

import { BookingFormWithWaitlist } from "@/components/public/booking/booking-form-with-waitlist";
import { BookingPolicyCard } from "@/components/public/booking/booking-policy-card";
import { BookingServicePicker } from "@/components/public/booking/booking-service-picker";
import { BookingStepsHeader } from "@/components/public/booking/booking-steps-header";
import { BookingSupportCard } from "@/components/public/booking/booking-support-card";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/lib/seo/business-json-ld";
import { generateBookingMetadata } from "@/lib/seo/business-metadata";
import { buildBookingDateOptions, findNextBookingDate, formatDateLabel } from "@/lib/bookings/format";
import { getPublicBusinessPageData, getPublicManageBookingData } from "@/server/queries/public";

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { service } = await searchParams;
    
    const pageData = await getPageData(slug);
    
    if (!pageData) {
      return { title: "Reserva no encontrada | ReservaYa" };
    }

    const serviceName = service
      ? pageData.services.find((s) => s.id === service)?.name
      : undefined;

    return generateBookingMetadata({
      businessName: pageData.business.name,
      slug,
      serviceName,
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Reservar turno | ReservaYa" };
  }
}

type BookingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    service?: string;
    date?: string;
    error?: string;
    reschedule?: string;
    token?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
};

function buildBookingHref(input: {
  slug: string;
  serviceId?: string;
  bookingDate?: string;
  rescheduleBookingId?: string;
  token?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}) {
  const params = new URLSearchParams();
  if (input.serviceId) params.set("service", input.serviceId);
  if (input.bookingDate) params.set("date", input.bookingDate);
  if (input.rescheduleBookingId) params.set("reschedule", input.rescheduleBookingId);
  if (input.token) params.set("token", input.token);
  if (input.source) params.set("utm_source", input.source);
  if (input.medium) params.set("utm_medium", input.medium);
  if (input.campaign) params.set("utm_campaign", input.campaign);
  const query = params.toString();
  return query ? `/${input.slug}/reservar?${query}` : `/${input.slug}/reservar`;
}


export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const rescheduleBooking = filters.reschedule
    ? await getPublicManageBookingData({
        slug,
        bookingId: filters.reschedule,
        token: filters.token,
      })
    : null;

  const effectiveServiceId = filters.service ?? rescheduleBooking?.serviceId;
  const pageData = await getPageData(slug);

  if (!pageData) notFound();

  const accentColor = pageData.profile?.accent || "#111111";
  const selectedService =
    pageData.services.find((service) => service.id === effectiveServiceId) ?? null;
  const whatsappHref = pageData.business.phone
    ? `https://wa.me/${pageData.business.phone.replace(/\D/g, "")}`
    : getSiteWhatsAppHref(`Hola, quiero reservar un turno en ${pageData.business.name}.`);
  const activeDays = pageData.weeklyHours
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.hoursLabel.toLocaleLowerCase("es-AR").includes("cerrado"))
    .map(({ index }) => index);
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const selectedDate =
    filters.date ??
    (activeDays.length > 0 ? findNextBookingDate(fallbackDate, activeDays) : fallbackDate);
  const datePickerOptions = buildBookingDateOptions(selectedDate, activeDays);

  // Preparar datos para JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reservaya.app";
  const businessUrl = `${siteUrl}/${slug}`;
  const bookingUrl = `${siteUrl}/${slug}/reservar`;
  const pageTitle = selectedService
    ? `Reservar ${selectedService.name} | ${pageData.business.name}`
    : `Reservar turno | ${pageData.business.name}`;

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
      {/* SEO: JSON-LD Structured Data */}
      <WebPageJsonLd
        name={pageTitle}
        description={`Reservá tu turno en ${pageData.business.name}. Elegí fecha, horario y servicio. Confirmación inmediata.`}
        url={bookingUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: siteUrl },
          { name: pageData.business.name, url: businessUrl },
          { name: "Reservar", url: bookingUrl },
        ]}
      />
      <main
        id="main-content"
        className="min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
        style={{
          background: `linear-gradient(180deg, ${pageData.profile?.surfaceTint ?? `${accentColor}08`} 0%, transparent 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <BookingStepsHeader
            backHref={`/${slug}`}
            currentStep={selectedService ? 2 : 1}
            accentColor={accentColor}
          />

          {/* Hero section */}
          {selectedService ? (
            <section className="mb-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur sm:mb-8 sm:p-8">
              <span className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-background/80 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {rescheduleBooking ? "Reprogramación" : "Reserva online"}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reservá tu turno para {selectedService.name}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Elegí fecha y horario, completá tus datos y listo.
              </p>
              {rescheduleBooking && (
                <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] border border-border/60 bg-background/85 p-4 text-sm text-muted-foreground">
                  <RefreshCcw className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Turno actual: {formatDateLabel(rescheduleBooking.bookingDate)} a las{" "}
                  {rescheduleBooking.startTime}.
                </div>
              )}
            </section>
          ) : (
            <section className="mb-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur sm:mb-8 sm:p-8">
              <span className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-background/80 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Reserva online
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                ¿Qué servicio querés reservar?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Elegí el servicio y después te mostramos los horarios disponibles.
              </p>
            </section>
          )}

          {selectedService ? (
            <BookingFormWithWaitlist
              slug={slug}
              accentColor={accentColor}
              service={{
                id: selectedService.id,
                name: selectedService.name,
                durationMinutes: selectedService.durationMinutes,
                priceLabel: selectedService.priceLabel,
              }}
              paymentMode={
                selectedService.price != null && selectedService.price > 0
                  ? pageData.business.mpConnected
                    ? "mercadopago"
                    : "cash"
                  : "none"
              }
              initialSelectedDate={selectedDate}
              initialDateOptions={datePickerOptions}
              todayDate={fallbackDate}
              changeHref={buildBookingHref({
                slug,
                bookingDate: selectedDate,
                rescheduleBookingId: filters.reschedule,
                token: filters.token,
                source: filters.utm_source,
                medium: filters.utm_medium,
                campaign: filters.utm_campaign,
              })}
              error={filters.error}
              rescheduleBookingId={rescheduleBooking?.id}
              manageToken={filters.token}
              source={filters.utm_source}
              medium={filters.utm_medium}
              campaign={filters.utm_campaign}
              rescheduleStartTime={rescheduleBooking?.startTime}
              defaultFullName={rescheduleBooking?.fullName}
              defaultEmail={rescheduleBooking?.email}
              defaultPhone={rescheduleBooking?.phone}
              defaultNotes={rescheduleBooking?.notes}
              isReschedule={!!rescheduleBooking}
              whatsappHref={whatsappHref}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <BookingServicePicker
                businessSlug={slug}
                accentColor={accentColor}
                heading="Elegí el servicio que querés reservar"
                description="Cuando elijas un servicio, vas a ver los horarios disponibles para ese día."
                prefetchDate={selectedDate}
                services={pageData.services}
                baseQueryParams={{
                  date: selectedDate,
                  reschedule: filters.reschedule,
                  token: filters.token,
                  utm_source: filters.utm_source,
                  utm_medium: filters.utm_medium,
                  utm_campaign: filters.utm_campaign,
                }}
              />

              <aside className="space-y-4 lg:sticky lg:top-6">
                <BookingPolicyCard />
                <BookingSupportCard whatsappHref={whatsappHref} />
              </aside>
            </div>
          )}
        </div>

        <PublicAnalyticsTracker
          businessSlug={slug}
          eventName="booking_page_view"
          pagePath={`/${slug}/reservar`}
        />
      </main>
    </PublicBusinessPageWrapper>
  );
}
