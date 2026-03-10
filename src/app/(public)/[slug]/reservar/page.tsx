import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  RefreshCcw,
  User,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { BookingPolicyCard } from "@/components/public/booking/booking-policy-card";
import { BookingSelectedServiceCard } from "@/components/public/booking/booking-selected-service-card";
import { BookingServicePicker } from "@/components/public/booking/booking-service-picker";
import { BookingStepsHeader } from "@/components/public/booking/booking-steps-header";
import { BookingSupportCard } from "@/components/public/booking/booking-support-card";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { formatDateLabel, formatShortDateLabel } from "@/lib/bookings/format";
import { cn } from "@/lib/utils";
import { createPublicBookingAction } from "@/server/actions/public-booking";
import {
  getPublicBookingFlowData,
  getPublicManageBookingData,
} from "@/server/queries/public";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";

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

  if (input.serviceId) {
    params.set("service", input.serviceId);
  }

  if (input.bookingDate) {
    params.set("date", input.bookingDate);
  }

  if (input.rescheduleBookingId) {
    params.set("reschedule", input.rescheduleBookingId);
  }

  if (input.token) {
    params.set("token", input.token);
  }

  if (input.source) {
    params.set("utm_source", input.source);
  }

  if (input.medium) {
    params.set("utm_medium", input.medium);
  }

  if (input.campaign) {
    params.set("utm_campaign", input.campaign);
  }

  const query = params.toString();
  return query ? `/${input.slug}/reservar?${query}` : `/${input.slug}/reservar`;
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const [pageData, rescheduleBooking] = await Promise.all([
    getPublicBookingFlowData({
      slug,
      serviceId: filters.service,
      bookingDate: filters.date,
    }),
    filters.reschedule
      ? getPublicManageBookingData({
          slug,
          bookingId: filters.reschedule,
          token: filters.token,
        })
      : Promise.resolve(null),
  ]);

  if (!pageData) {
    notFound();
  }

  const whatsappHref = `https://wa.me/${(pageData.business.phone ?? "5491155550199").replace(/\D/g, "")}`;
  const selectedDateLabel = formatDateLabel(pageData.bookingDate);
  const formError = filters.error ?? "";

  // Business accent color (fallback to black)
  const accentColor = pageData.profile?.accent || "#000000";

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
      <main
        id="main-content"
        className="min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
      >
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
          <BookingStepsHeader backHref={`/${slug}`} />

        {pageData.selectedService ? (
          <BookingSelectedServiceCard
            accentColor={accentColor}
            service={pageData.selectedService}
          />
        ) : (
          <BookingServicePicker
            accentColor={accentColor}
            heading="Selecciona un servicio"
            description="Elige el servicio que quieres reservar"
            services={pageData.services}
            getHref={(serviceId) =>
              buildBookingHref({
                slug,
                serviceId,
                bookingDate: pageData.bookingDate,
                rescheduleBookingId: filters.reschedule,
                token: filters.token,
                source: filters.utm_source,
                medium: filters.utm_medium,
                campaign: filters.utm_campaign,
              })
            }
          />
        )}

        {pageData.selectedService && (
          <form action={createPublicBookingAction} className="space-y-8 sm:space-y-10">
            <input type="hidden" name="businessSlug" value={slug} />
            <input type="hidden" name="serviceId" value={pageData.selectedService.id} />
            <input type="hidden" name="bookingDate" value={pageData.bookingDate} />
            <input
              type="hidden"
              name="rescheduleBookingId"
              value={rescheduleBooking?.id ?? ""}
            />
            <input type="hidden" name="manageToken" value={filters.token ?? ""} />
            <input type="hidden" name="source" value={filters.utm_source ?? ""} />
            <input type="hidden" name="medium" value={filters.utm_medium ?? ""} />
            <input type="hidden" name="campaign" value={filters.utm_campaign ?? ""} />

            {rescheduleBooking && (
              <div className="rounded-xl border border-border/70 bg-secondary/60 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <RefreshCcw aria-hidden="true" className="mt-0.5 size-4 text-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Estás reprogramando tu turno
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Turno actual: {formatDateLabel(rescheduleBooking.bookingDate)} a las{" "}
                      {rescheduleBooking.startTime}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div
                aria-live="polite"
                className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 sm:p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Date Selection */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4 sm:size-5" style={{ color: accentColor }} />
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Elige el día</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
                {pageData.dateOptions.map((dateOption) => {
                  const isSelected = dateOption === pageData.bookingDate;

                  return (
                    <Link
                      key={dateOption}
                      href={buildBookingHref({
                        slug,
                        serviceId: pageData.selectedService?.id,
                        bookingDate: dateOption,
                        rescheduleBookingId: filters.reschedule,
                        token: filters.token,
                        source: filters.utm_source,
                        medium: filters.utm_medium,
                        campaign: filters.utm_campaign,
                      })}
                      className={cn(
                        "relative rounded-xl border px-3 sm:px-4 py-3 sm:py-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-h-[4rem] sm:min-h-0 flex flex-col justify-center",
                        isSelected
                          ? "border-transparent text-white shadow-md"
                          : "border-border/70 bg-card text-card-foreground hover:border-foreground/30 hover:shadow-sm"
                      )}
                      style={isSelected ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute right-2 top-2 size-3.5 sm:size-4 text-white/80" />
                      )}
                      <span className={cn("block text-[10px] sm:text-xs uppercase tracking-wide", isSelected ? "text-white/80" : "text-muted-foreground")}>
                        {formatShortDateLabel(dateOption)}
                      </span>
                      <span className={cn("mt-0.5 sm:mt-1 block text-sm font-semibold", isSelected && "text-white")}>
                        {new Date(dateOption).getDate()} {new Date(dateOption).toLocaleDateString('es-AR', { month: 'short' })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <fieldset className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4 sm:size-5" style={{ color: accentColor }} />
                  <legend className="text-base sm:text-lg font-semibold text-foreground">¿A qué hora?</legend>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedDateLabel}
                </span>
              </div>
              
              {pageData.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-4">
                  {pageData.slots.map((slot) => (
                    <label 
                      key={slot} 
                      className="group cursor-pointer"
                      style={{ ['--accent-color' as string]: accentColor }}
                    >
                      <input
                        type="radio"
                        name="startTime"
                        value={slot}
                        className="sr-only"
                        defaultChecked={rescheduleBooking?.startTime === slot}
                        required
                      />
                      <span 
                        className="flex items-center justify-center rounded-xl border-2 border-border bg-card py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-foreground/30 group-has-[:checked]:border-transparent group-has-[:checked]:bg-[var(--accent-color)] group-has-[:checked]:text-white group-has-[:checked]:shadow-md min-h-[2.75rem] sm:min-h-0"
                      >
                        {slot}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-secondary/50 p-4 sm:p-6 text-center">
                  <Clock3 className="mx-auto size-6 sm:size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay horarios disponibles para esta fecha.
                  </p>
                  <p className="text-xs text-muted-foreground/70">Prueba con otro día</p>
                </div>
              )}
            </fieldset>

            {/* Personal Data */}
            <section className="space-y-5 sm:space-y-6">
              <div className="flex items-center gap-2">
                <User aria-hidden="true" className="size-4 sm:size-5" style={{ color: accentColor }} />
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Tus datos</h2>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="fullName" className="flex items-center gap-1 text-sm font-medium text-foreground">
                    Nombre completo
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      placeholder="Ej: María González"
                      className="minimalist-input pl-10 h-11 sm:h-auto"
                      defaultValue={rescheduleBooking?.fullName ?? ""}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="phone" className="flex items-center gap-1 text-sm font-medium text-foreground">
                    Teléfono (WhatsApp)
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <WhatsAppIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Ej: 11 5555 5555"
                      className="minimalist-input pl-10 h-11 sm:h-auto"
                      defaultValue={rescheduleBooking?.phone ?? ""}
                      required
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Usaremos este número si el negocio activa recordatorios o soporte por WhatsApp
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Correo electrónico
                    <span className="ml-1 text-[10px] sm:text-xs font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="Ej: maria@email.com"
                      className="minimalist-input pl-10 h-11 sm:h-auto"
                      defaultValue={rescheduleBooking?.email ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notas adicionales
                    <span className="ml-1 text-[10px] sm:text-xs font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <textarea
                      id="notes"
                      name="notes"
                      autoComplete="off"
                      placeholder="Ej: tengo alergia a ciertos productos, prefiero atención puntual..."
                      className="minimalist-input min-h-[80px] sm:min-h-[100px] resize-none pl-10 pt-2.5"
                      defaultValue={rescheduleBooking?.notes ?? ""}
                    />
                  </div>
                </div>
              </div>
            </section>

            <BookingPolicyCard />

            {/* Submit Button */}
            <div className="pt-2 sm:pt-4">
              <PublicSubmitButton 
                className="h-12 sm:h-14 w-full rounded-xl text-sm sm:text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                {rescheduleBooking ? "Guardar nuevo horario" : "Confirmar reserva"}
              </PublicSubmitButton>
              <p className="mt-3 text-center text-[10px] sm:text-xs text-muted-foreground">
                Al confirmar, aceptas nuestras políticas de reserva
              </p>
            </div>
          </form>
        )}

          <BookingSupportCard whatsappHref={whatsappHref} />
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
