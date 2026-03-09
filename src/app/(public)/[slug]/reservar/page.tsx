import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  RefreshCcw,
  User,
  Mail,
  FileText,
  CheckCircle2,
  Shield,
  AlertCircle,
} from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { buttonVariants } from "@/components/ui/button-variants";
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
        <div className="mx-auto max-w-xl px-6 py-8">
        {/* Header con pasos */}
        <div className="mb-8">
          <Link
            href={`/${slug}`}
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al inicio
          </Link>
          
          {/* Indicador de pasos */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
              <span className="flex size-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-foreground">1</span>
              Servicio
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">2</span>
              Fecha y hora
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">3</span>
              Datos
            </div>
          </div>
        </div>

        {pageData.selectedService ? (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg">
            {/* Service Card Header */}
            <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-lg">
                  <Clock3 className="size-8 text-foreground" style={{ color: accentColor }} />
                </div>
              </div>
            </div>
            
            {/* Service Card Body */}
            <div className="p-6">
              <h1 className="text-xl font-bold text-card-foreground">
                {pageData.selectedService.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span 
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  <Clock3 aria-hidden="true" className="size-4" />
                  {pageData.selectedService.durationMinutes} min
                </span>
                <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-foreground">
                  {pageData.selectedService.priceLabel}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Selecciona un servicio
            </h1>
            <p className="mt-2 text-muted-foreground">Elige el servicio que quieres reservar</p>
            <div className="mt-6 flex flex-col gap-3">
              {pageData.services.map((service) => (
                <Link
                  key={service.id}
                  href={buildBookingHref({
                    slug,
                    serviceId: service.id,
                    bookingDate: pageData.bookingDate,
                    rescheduleBookingId: filters.reschedule,
                    token: filters.token,
                    source: filters.utm_source,
                    medium: filters.utm_medium,
                    campaign: filters.utm_campaign,
                  })}
                  className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-foreground/30 hover:shadow-md hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-card-foreground group-hover:text-foreground">{service.name}</p>
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
        )}

        {pageData.selectedService && (
          <form action={createPublicBookingAction} className="space-y-10">
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
              <div className="rounded-xl border border-border/70 bg-secondary/60 p-4">
                <div className="flex items-start gap-3">
                  <RefreshCcw aria-hidden="true" className="mt-0.5 size-4 text-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Estás reprogramando tu turno
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
                className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Date Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-5" style={{ color: accentColor }} />
                <h2 className="text-lg font-semibold text-foreground">Elige el día</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                        "relative rounded-xl border px-4 py-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        isSelected
                          ? "border-transparent text-white shadow-md"
                          : "border-border/70 bg-card text-card-foreground hover:border-foreground/30 hover:shadow-sm"
                      )}
                      style={isSelected ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute right-2 top-2 size-4 text-white/80" />
                      )}
                      <span className={cn("block text-xs uppercase tracking-wide", isSelected ? "text-white/80" : "text-muted-foreground")}>
                        {formatShortDateLabel(dateOption)}
                      </span>
                      <span className={cn("mt-1 block text-sm font-semibold", isSelected && "text-white")}>
                        {new Date(dateOption).getDate()} {new Date(dateOption).toLocaleDateString('es-AR', { month: 'short' })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <fieldset className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-5" style={{ color: accentColor }} />
                  <legend className="text-lg font-semibold text-foreground">¿A qué hora?</legend>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedDateLabel}
                </span>
              </div>
              
              {pageData.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                        className="flex items-center justify-center rounded-xl border-2 border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-all hover:border-foreground/30 group-has-[:checked]:border-transparent group-has-[:checked]:bg-[var(--accent-color)] group-has-[:checked]:text-white group-has-[:checked]:shadow-md"
                      >
                        {slot}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-secondary/50 p-6 text-center">
                  <Clock3 className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay horarios disponibles para esta fecha.
                  </p>
                  <p className="text-xs text-muted-foreground/70">Prueba con otro día</p>
                </div>
              )}
            </fieldset>

            {/* Personal Data */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <User aria-hidden="true" className="size-5" style={{ color: accentColor }} />
                <h2 className="text-lg font-semibold text-foreground">Tus datos</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
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
                      className="minimalist-input pl-10"
                      defaultValue={rescheduleBooking?.fullName ?? ""}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
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
                      className="minimalist-input pl-10"
                      defaultValue={rescheduleBooking?.phone ?? ""}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Te enviaremos la confirmación por WhatsApp
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Correo electrónico
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
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
                      className="minimalist-input pl-10"
                      defaultValue={rescheduleBooking?.email ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notas adicionales
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <textarea
                      id="notes"
                      name="notes"
                      autoComplete="off"
                      placeholder="Ej: tengo alergia a ciertos productos, prefiero atención puntual..."
                      className="minimalist-input min-h-[100px] resize-none pl-10 pt-2.5"
                      defaultValue={rescheduleBooking?.notes ?? ""}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Policies */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Políticas de reserva</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Puedes cancelar o reprogramar hasta 24hs antes</li>
                    <li>• Te enviaremos un recordatorio por WhatsApp</li>
                    <li>• Llega 10 minutos antes de tu horario</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <PublicSubmitButton 
                className="h-14 w-full rounded-xl text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                {rescheduleBooking ? "Guardar nuevo horario" : "Confirmar reserva"}
              </PublicSubmitButton>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Al confirmar, aceptas nuestras políticas de reserva
              </p>
            </div>
          </form>
        )}

        {/* WhatsApp Support */}
        <div className="mt-12 rounded-2xl border border-border/70 bg-secondary/30 p-6 text-center">
          <p className="text-sm font-medium text-foreground">¿Tienes dudas sobre tu reserva?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Escríbenos por WhatsApp y te ayudamos
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95"
            )}
          >
            <WhatsAppIcon className="size-4" />
            Contactar por WhatsApp
          </a>
        </div>
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
