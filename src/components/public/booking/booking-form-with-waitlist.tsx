"use client";

import { useState, useRef } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  User,
  Pencil,
} from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { BookingPolicyCard } from "@/components/public/booking/booking-policy-card";
import { BookingScheduleSection } from "@/components/public/booking/booking-schedule-section";
import { BookingSelectedServiceCard } from "@/components/public/booking/booking-selected-service-card";
import { BookingSupportCard } from "@/components/public/booking/booking-support-card";
import { BookingWaitlistForm } from "@/components/public/booking/booking-waitlist-form";
import { PublicSubmitButton } from "@/components/public/public-submit-button";
import { createPublicBookingAction } from "@/server/actions/public-booking";

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
}

interface BookingFormWithWaitlistProps {
  slug: string;
  accentColor: string;
  service: ServiceInfo;
  paymentMode: "mercadopago" | "cash" | "none";
  initialSelectedDate: string;
  initialDateOptions: string[];
  todayDate: string;
  changeHref: string;
  error?: string;
  rescheduleBookingId?: string;
  manageToken?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  rescheduleStartTime?: string;
  defaultFullName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  defaultNotes?: string;
  isReschedule?: boolean;
  whatsappHref?: string;
}

export function BookingFormWithWaitlist({
  slug,
  accentColor,
  service,
  paymentMode,
  initialSelectedDate,
  initialDateOptions,
  todayDate,
  changeHref,
  error,
  rescheduleBookingId,
  manageToken,
  source,
  medium,
  campaign,
  rescheduleStartTime,
  defaultFullName = "",
  defaultEmail = "",
  defaultPhone = "",
  defaultNotes = "",
  isReschedule = false,
  whatsappHref,
}: BookingFormWithWaitlistProps) {
  const [noSlotsDate, setNoSlotsDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>(rescheduleStartTime ?? "");
  const [confirming, setConfirming] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState<{ date: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleReviewClick() {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    setConfirmSummary({
      date: String(fd.get("bookingDate") ?? ""),
      name: String(fd.get("fullName") ?? ""),
    });
    setConfirming(true);
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const paymentSummary =
    paymentMode === "mercadopago"
      ? {
          title: "Pago online",
          badge: "Cobro online con Mercado Pago",
          description:
            "Al confirmar te redirigimos a Mercado Pago. El turno queda confirmado cuando el pago se acredita.",
          buttonLabel: isReschedule ? "Guardar nuevo horario" : "Continuar al pago",
        }
      : paymentMode === "cash"
        ? {
            title: "Pago en el local",
            badge: "Cobro presencial en efectivo",
            description: "Reservás ahora y abonás en efectivo cuando llegues al negocio.",
            buttonLabel: isReschedule ? "Guardar nuevo horario" : "Confirmar reserva",
          }
        : {
            title: "Confirmación",
            badge: "Sin cobro online",
            description:
              "La confirmación llega al instante y después puedes gestionar el turno desde tu link.",
            buttonLabel: isReschedule ? "Guardar nuevo horario" : "Confirmar reserva",
          };

  return (
    <>
      <form
        ref={formRef}
        action={createPublicBookingAction}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        {/* Hidden fields */}
        <input type="hidden" name="businessSlug" value={slug} />
        <input type="hidden" name="serviceId" value={service.id} />
        <input type="hidden" name="rescheduleBookingId" value={rescheduleBookingId ?? ""} />
        <input type="hidden" name="manageToken" value={manageToken ?? ""} />
        <input type="hidden" name="source" value={source ?? ""} />
        <input type="hidden" name="medium" value={medium ?? ""} />
        <input type="hidden" name="campaign" value={campaign ?? ""} />

        {/* Main column */}
        <div className="space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <BookingSelectedServiceCard
            accentColor={accentColor}
            service={service}
            paymentMode={paymentMode}
            changeHref={changeHref}
          />

          <BookingScheduleSection
            slug={slug}
            serviceId={service.id}
            accentColor={accentColor}
            initialSelectedDate={initialSelectedDate}
            initialDateOptions={initialDateOptions}
            todayDate={todayDate}
            rescheduleStartTime={rescheduleStartTime}
            onNoSlots={setNoSlotsDate}
            onSelectSlot={setSelectedSlot}
          />

          {!noSlotsDate && (
            /* Datos del cliente */
            <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Completá tus datos
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Solo pedimos la información justa para confirmar y poder contactarte si hace falta.
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
                  <User aria-hidden="true" className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Ej: María González…"
                    className="minimalist-input pl-7"
                    defaultValue={defaultFullName}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                <label
                  htmlFor="email"
                  className="flex items-center gap-1 text-sm font-medium text-foreground"
                >
                  Correo electrónico
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative mt-3">
                  <Mail aria-hidden="true" className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="Ej: maria@email.com…"
                    className="minimalist-input pl-7"
                    defaultValue={defaultEmail}
                    required
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  WhatsApp
                  <span className="ml-1 text-xs font-normal text-muted-foreground">opcional</span>
                </label>
                <div className="relative mt-3">
                  <WhatsAppIcon aria-hidden="true" className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ej: 11 5555 5555…"
                    className="minimalist-input pl-7"
                    defaultValue={defaultPhone}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Si lo ingresás, el negocio puede enviarte recordatorios por WhatsApp.
                </p>
              </div>

              {/* Notas */}
              <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4 md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-foreground">
                  Notas adicionales
                  <span className="ml-1 text-xs font-normal text-muted-foreground">opcional</span>
                </label>
                <div className="relative mt-3">
                  <FileText aria-hidden="true" className="absolute left-0 top-3 size-4 text-muted-foreground" />
                  <textarea
                    id="notes"
                    name="notes"
                    autoComplete="off"
                    placeholder="Ej: prefiero puntualidad, tengo una indicación especial o quiero dejar un detalle rápido…"
                    className="minimalist-input min-h-[110px] resize-none pl-7 pt-0"
                    defaultValue={defaultNotes}
                  />
                </div>
              </div>
            </div>
          </section>
          )}
        </div>

        {/* Sidebar */}
        {!noSlotsDate && (
          <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Resumen del turno
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                <CalendarDays
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: accentColor }}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Fecha y horario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Elegí arriba</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Seleccioná una fecha y luego el horario disponible.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                <Clock3 className="mt-0.5 size-4 shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Precio
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{service.priceLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sin pasos extra ni costos ocultos
                  </p>
                </div>
              </div>

              {paymentMode !== "none" && (
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {paymentSummary.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{paymentSummary.badge}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {paymentSummary.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              {confirming && confirmSummary ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      ¿Todo correcto?
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatDate(confirmSummary.date)} · {selectedSlot}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-foreground">{service.name} — {service.durationMinutes} min</span>
                      </div>
                      {confirmSummary.name && (
                        <div className="flex items-center gap-2">
                          <User className="size-4 shrink-0 text-muted-foreground" />
                          <span className="text-foreground">{confirmSummary.name}</span>
                        </div>
                      )}
                    </div>
                    {paymentMode === "mercadopago" && (
                      <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
                        Al confirmar serás redirigido a Mercado Pago para completar el pago.
                      </p>
                    )}
                  </div>

                  <PublicSubmitButton
                    className="h-12 rounded-2xl text-sm font-semibold sm:text-base"
                    style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    pendingLabel={paymentMode === "mercadopago" ? "Redirigiendo a MercadoPago..." : "Confirmando reserva..."}
                  >
                    {paymentMode === "mercadopago" ? "Confirmar y pagar" : "Sí, confirmar turno"}
                  </PublicSubmitButton>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil aria-hidden="true" className="size-3.5" />
                    Volver a editar
                  </button>
                </div>
              ) : selectedSlot ? (
                <button
                  type="button"
                  onClick={handleReviewClick}
                  className="h-12 w-full rounded-2xl text-sm font-semibold sm:text-base inline-flex items-center justify-center text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  {paymentSummary.buttonLabel}
                </button>
              ) : (
                <div className="flex h-12 w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-sm font-semibold text-muted-foreground/50 cursor-not-allowed">
                  Elegí un horario para continuar
                </div>
              )}
              {!confirming && (
                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                  Al confirmar aceptás las{" "}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    condiciones de uso
                  </a>{" "}
                  y las políticas del negocio.
                </p>
              )}
            </div>
            </section>

          <BookingPolicyCard />
          {whatsappHref && <BookingSupportCard whatsappHref={whatsappHref} />}
        </aside>
        )}
      </form>

      {/* Waitlist fuera del form principal para evitar <form> anidados */}
      {noSlotsDate && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="rounded-[1.75rem] border-2 border-warning/40 bg-warning/5 p-5 sm:p-6">
            <p className="text-center text-sm font-semibold text-foreground">
              No hay horarios disponibles para el {formatDate(noSlotsDate)}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Dejá tu email y te avisamos si alguien cancela
            </p>
            <div className="mt-4">
              <BookingWaitlistForm
                businessSlug={slug}
                serviceId={service.id}
                bookingDate={noSlotsDate}
                accentColor={accentColor}
              />
            </div>
          </section>
          <aside className="space-y-4 lg:sticky lg:top-6">
            <BookingPolicyCard />
            {whatsappHref && <BookingSupportCard whatsappHref={whatsappHref} />}
          </aside>
        </div>
      )}
    </>
  );
}
