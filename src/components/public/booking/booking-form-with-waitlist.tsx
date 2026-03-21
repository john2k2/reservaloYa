"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  User,
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
  initialSelectedDate: string;
  initialDateOptions: string[];
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
  initialSelectedDate,
  initialDateOptions,
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

  return (
    <>
      <form
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
              aria-live="polite"
              className="flex items-start gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <BookingSelectedServiceCard
            accentColor={accentColor}
            service={service}
            changeHref={changeHref}
          />

          {/* Paso 2 — Fecha y hora */}
          <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-3 shadow-sm sm:p-4">
            <div className="mb-4 px-2 pt-2 sm:px-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Paso 2
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Elige día y hora
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Solo días con disponibilidad real. Selecciona una fecha y después el horario.
              </p>
            </div>
            <BookingScheduleSection
              slug={slug}
              serviceId={service.id}
              accentColor={accentColor}
              initialSelectedDate={initialSelectedDate}
              initialDateOptions={initialDateOptions}
              rescheduleStartTime={rescheduleStartTime}
              onNoSlots={setNoSlotsDate}
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
                  <User className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Ej: Maria Gonzalez"
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
                  <Mail className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="Ej: maria@email.com"
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
                  <WhatsAppIcon className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ej: 11 5555 5555"
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
                  <FileText className="absolute left-0 top-3 size-4 text-muted-foreground" />
                  <textarea
                    id="notes"
                    name="notes"
                    autoComplete="off"
                    placeholder="Ej: prefiero puntualidad, tengo una indicacion especial o quiero dejar un detalle rapido..."
                    className="minimalist-input min-h-[110px] resize-none pl-7 pt-0"
                    defaultValue={defaultNotes}
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
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Servicio
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{service.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {service.durationMinutes} min de duración
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
                    Fecha y horario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Calendario activo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Los horarios se cargan al instante cuando eliges una fecha.
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
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-border/60 bg-background/85 p-4">
              <p className="text-sm font-semibold text-foreground">
                Elige la hora y después envía tus datos.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                La confirmación llega al instante y después puedes gestionar el turno desde tu
                link.
              </p>
            </div>

            <div className="mt-6">
              <PublicSubmitButton
                className="h-12 rounded-2xl text-sm font-semibold sm:text-base"
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                {isReschedule ? "Guardar nuevo horario" : "Confirmar reserva"}
              </PublicSubmitButton>
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
            </div>
          </section>

          <BookingPolicyCard />
          {whatsappHref && <BookingSupportCard whatsappHref={whatsappHref} />}
        </aside>
      </form>

      {/* Waitlist form rendered OUTSIDE <form> to avoid nested forms */}
      {noSlotsDate && (
        <div className="mt-6 rounded-2xl border-2 border-warning/30 bg-warning/5 p-5">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold text-foreground">No hay horarios disponibles</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dejá tu email y te avisamos si alguien cancela
            </p>
          </div>
          <BookingWaitlistForm
            businessSlug={slug}
            serviceId={service.id}
            bookingDate={noSlotsDate}
            accentColor={accentColor}
          />
        </div>
      )}
    </>
  );
}
