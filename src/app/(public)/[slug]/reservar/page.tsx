import { notFound } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  RefreshCcw,
  User,
} from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { BookingDateTimePicker } from "@/components/public/booking/booking-date-time-picker";
import { BookingPolicyCard } from "@/components/public/booking/booking-policy-card";
import { BookingSelectedServiceCard } from "@/components/public/booking/booking-selected-service-card";
import { BookingServicePicker } from "@/components/public/booking/booking-service-picker";
import { BookingStepsHeader } from "@/components/public/booking/booking-steps-header";
import { BookingSupportCard } from "@/components/public/booking/booking-support-card";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { formatDateLabel } from "@/lib/bookings/format";
import { createPublicBookingAction } from "@/server/actions/public-booking";
import { getPublicBookingFlowData, getPublicManageBookingData } from "@/server/queries/public";

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
  const pageData = await getPublicBookingFlowData({
    slug,
    serviceId: effectiveServiceId,
    bookingDate: filters.date,
  });

  if (!pageData) notFound();

  const accentColor = pageData.profile?.accent || "#111111";
  const selectedService = effectiveServiceId ? pageData.selectedService : null;
  const whatsappHref = `https://wa.me/${(pageData.business.phone ?? "5491155550199").replace(/\D/g, "")}`;
  const selectedDateLabel = formatDateLabel(pageData.bookingDate);
  const hasSlots = pageData.slots.length > 0;

  const datePickerOptions = pageData.dateOptions.map((dateOption) => ({
    value: dateOption,
    href: buildBookingHref({
      slug,
      serviceId: selectedService?.id,
      bookingDate: dateOption,
      rescheduleBookingId: filters.reschedule,
      token: filters.token,
      source: filters.utm_source,
      medium: filters.utm_medium,
      campaign: filters.utm_campaign,
    }),
    isSelected: dateOption === pageData.bookingDate,
    isToday: dateOption === new Date().toISOString().slice(0, 10),
  }));

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
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
          <section className="mb-6 grid gap-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur sm:mb-8 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-background/80 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {rescheduleBooking ? "Reprogramacion" : "Reserva online"}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {selectedService
                  ? `Reserva tu turno para ${selectedService.name}.`
                  : "Elige un servicio y despues tu turno."}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {selectedService
                  ? "Ya tienes el servicio definido. Ahora te mostramos dias y horas reales para confirmar el turno sin vueltas."
                  : "Primero selecciona que quieres reservar. Cuando lo hagas, vas a ver disponibilidad real y el formulario final."}
              </p>
              {rescheduleBooking && (
                <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] border border-border/60 bg-background/85 p-4 text-sm text-muted-foreground">
                  <RefreshCcw className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Turno actual: {formatDateLabel(rescheduleBooking.bookingDate)} a las{" "}
                  {rescheduleBooking.startTime}.
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-background/85 p-5">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Negocio
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {pageData.business.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pageData.business.address ?? "Direccion a confirmar"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Horarios
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Los horarios visibles son los que atienden
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Estado del flujo
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedService
                      ? `${pageData.slots.length} horarios disponibles para reservar`
                      : `${pageData.services.length} servicios disponibles para elegir`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {selectedService ? (
            <form
              action={createPublicBookingAction}
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
            >
              {/* Hidden fields */}
              <input type="hidden" name="businessSlug" value={slug} />
              <input type="hidden" name="serviceId" value={selectedService.id} />
              <input type="hidden" name="bookingDate" value={pageData.bookingDate} />
              <input type="hidden" name="rescheduleBookingId" value={rescheduleBooking?.id ?? ""} />
              <input type="hidden" name="manageToken" value={filters.token ?? ""} />
              <input type="hidden" name="source" value={filters.utm_source ?? ""} />
              <input type="hidden" name="medium" value={filters.utm_medium ?? ""} />
              <input type="hidden" name="campaign" value={filters.utm_campaign ?? ""} />

              {/* Main column */}
              <div className="space-y-6">
                {filters.error && (
                  <div
                    aria-live="polite"
                    className="flex items-start gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {filters.error}
                  </div>
                )}

                <BookingSelectedServiceCard
                  accentColor={accentColor}
                  service={selectedService}
                  changeHref={buildBookingHref({
                    slug,
                    bookingDate: pageData.bookingDate,
                    rescheduleBookingId: filters.reschedule,
                    token: filters.token,
                    source: filters.utm_source,
                    medium: filters.utm_medium,
                    campaign: filters.utm_campaign,
                  })}
                />

                {/* Paso 2 — Fecha y hora */}
                <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-3 shadow-sm sm:p-4">
                  <div className="mb-4 px-2 pt-2 sm:px-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Paso 2
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      Elige dia y hora
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Solo dias con disponibilidad real. Selecciona una fecha y despues el horario.
                    </p>
                  </div>
                  <BookingDateTimePicker
                    accentColor={accentColor}
                    dateOptions={datePickerOptions}
                    selectedDate={pageData.bookingDate}
                    selectedDateLabel={selectedDateLabel}
                    slots={pageData.slots}
                    rescheduleStartTime={rescheduleBooking?.startTime}
                  />
                </section>

                {/* Paso 3 — Datos */}
                <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Paso 3
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Completa tus datos
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Solo pedimos la informacion justa para confirmar y poder contactarte si hace
                    falta.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {/* Nombre */}
                    <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                      <label
                        htmlFor="fullName"
                        className="flex items-center gap-1 text-sm font-medium text-foreground"
                      >
                        Nombre completo
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative mt-3">
                        <User className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="fullName"
                          name="fullName"
                          autoComplete="name"
                          placeholder="Ej: Maria Gonzalez"
                          className="minimalist-input pl-7"
                          defaultValue={rescheduleBooking?.fullName ?? ""}
                          required
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                      <label
                        htmlFor="phone"
                        className="flex items-center gap-1 text-sm font-medium text-foreground"
                      >
                        WhatsApp
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative mt-3">
                        <WhatsAppIcon className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="Ej: 11 5555 5555"
                          className="minimalist-input pl-7"
                          defaultValue={rescheduleBooking?.phone ?? ""}
                          required
                        />
                      </div>
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Usaremos este numero si el negocio activa recordatorios o soporte por
                        WhatsApp.
                      </p>
                    </div>

                    {/* Email */}
                    <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Correo electronico
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          opcional
                        </span>
                      </label>
                      <div className="relative mt-3">
                        <Mail className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          spellCheck={false}
                          placeholder="Ej: maria@email.com"
                          className="minimalist-input pl-7"
                          defaultValue={rescheduleBooking?.email ?? ""}
                        />
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4 md:col-span-2">
                      <label htmlFor="notes" className="text-sm font-medium text-foreground">
                        Notas adicionales
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          opcional
                        </span>
                      </label>
                      <div className="relative mt-3">
                        <FileText className="absolute left-0 top-3 size-4 text-muted-foreground" />
                        <textarea
                          id="notes"
                          name="notes"
                          autoComplete="off"
                          placeholder="Ej: prefiero puntualidad, tengo una indicacion especial o quiero dejar un detalle rapido..."
                          className="minimalist-input min-h-[110px] resize-none pl-7 pt-0"
                          defaultValue={rescheduleBooking?.notes ?? ""}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside className="space-y-4 lg:sticky lg:top-6">
                <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Resumen del turno
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    Todo listo para confirmar
                  </h3>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0"
                        style={{ color: accentColor }}
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Servicio
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {selectedService.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selectedService.durationMinutes} min de duracion
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                      <CalendarDays
                        className="mt-0.5 size-4 shrink-0"
                        style={{ color: accentColor }}
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Dia
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {selectedDateLabel}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {hasSlots
                            ? `${pageData.slots.length} horarios disponibles hoy`
                            : "Cambia de fecha para ver otra disponibilidad"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                      <Clock3
                        className="mt-0.5 size-4 shrink-0"
                        style={{ color: accentColor }}
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Precio
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {selectedService.priceLabel}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sin pasos extra ni costos ocultos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {hasSlots
                        ? "Solo falta elegir la hora y enviar tus datos."
                        : "Primero cambia de fecha para habilitar horarios."}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      La confirmacion llega al instante y despues puedes gestionar el turno desde
                      tu link.
                    </p>
                  </div>

                  <div className="mt-6">
                    <PublicSubmitButton
                      className="h-12 rounded-2xl text-sm font-semibold sm:text-base"
                      style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    >
                      {rescheduleBooking ? "Guardar nuevo horario" : "Confirmar reserva"}
                    </PublicSubmitButton>
                    <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                      Al confirmar aceptas las politicas del negocio y bloqueamos ese horario para
                      ti.
                    </p>
                  </div>
                </section>

                <BookingPolicyCard />
                <BookingSupportCard whatsappHref={whatsappHref} />
              </aside>
            </form>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <BookingServicePicker
                accentColor={accentColor}
                heading="Selecciona el servicio que quieres reservar"
                description="Este es el primer paso real del flujo. Cuando elijas uno, te mostraremos solo la disponibilidad que corresponde."
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

              <aside className="space-y-4 lg:sticky lg:top-6">
                <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Asi funciona
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      "Elige el servicio que quieres reservar.",
                      "Mira solo horarios reales para ese servicio.",
                      "Confirma tus datos y recibe tu turno.",
                    ].map((text, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                      >
                        <span className="mr-3 inline-flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                          {i + 1}
                        </span>
                        {text}
                      </div>
                    ))}
                  </div>
                </section>

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
