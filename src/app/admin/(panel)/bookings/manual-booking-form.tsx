"use client";

import { useRef, useState } from "react";
import { X, CalendarClock, Clock3, User, Phone, Mail, MessageSquareText } from "lucide-react";

import { createManualBookingAction } from "@/app/admin/(panel)/bookings/actions";
import { LoadingButton } from "@/components/ui/loading-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string; durationMinutes: number; priceLabel: string };

export function ManualBookingForm({
  services,
  onClose,
}: {
  services: Service[];
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-border/60 bg-background p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-foreground">Nuevo turno manual</h2>
          <p className="text-xs text-muted-foreground">
            Para clientes que reservan por teléfono o en persona. El turno queda confirmado automáticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "shrink-0")}
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>

      <form ref={formRef} action={createManualBookingAction} className="space-y-4">
        {/* Servicio */}
        <div className="space-y-1">
          <label htmlFor="manual-service" className="text-xs font-medium">
            Servicio *
          </label>
          {services.length === 0 ? (
            <p className="text-sm text-destructive">
              Primero agregá al menos un servicio en la sección Servicios.
            </p>
          ) : (
            <select
              id="manual-service"
              name="serviceId"
              required
              defaultValue=""
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
            >
              <option value="" disabled>
                Seleccioná el servicio
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.durationMinutes} min
                  {s.priceLabel ? ` · ${s.priceLabel}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="manual-date" className="text-xs font-medium flex items-center gap-1">
              <CalendarClock className="size-3" /> Fecha *
            </label>
            <input
              id="manual-date"
              name="bookingDate"
              type="date"
              required
              defaultValue={today}
              min={today}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="manual-time" className="text-xs font-medium flex items-center gap-1">
              <Clock3 className="size-3" /> Hora *
            </label>
            <input
              id="manual-time"
              name="startTime"
              type="time"
              required
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
            />
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del cliente
          </p>
          <div className="space-y-1">
            <label htmlFor="manual-name" className="text-xs font-medium flex items-center gap-1">
              <User className="size-3" /> Nombre completo *
            </label>
            <input
              id="manual-name"
              name="fullName"
              type="text"
              required
              maxLength={80}
              placeholder="Juan García"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="manual-phone" className="text-xs font-medium flex items-center gap-1">
                <Phone className="size-3" /> Teléfono
              </label>
              <input
                id="manual-phone"
                name="phone"
                type="tel"
                maxLength={30}
                placeholder="+54 9 11..."
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="manual-email" className="text-xs font-medium flex items-center gap-1">
                <Mail className="size-3" /> Email
              </label>
              <input
                id="manual-email"
                name="email"
                type="email"
                maxLength={120}
                placeholder="juan@mail.com"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="manual-notes" className="text-xs font-medium flex items-center gap-1">
              <MessageSquareText className="size-3" /> Notas internas
            </label>
            <span className={cn("text-[10px] tabular-nums", notes.length > 360 ? "text-amber-600" : "text-muted-foreground")}>
              {notes.length}/400
            </span>
          </div>
          <textarea
            id="manual-notes"
            name="notes"
            rows={2}
            maxLength={400}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Cliente prefiere silla del fondo"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <LoadingButton
            className="h-9 flex-1 text-sm"
            disabled={services.length === 0}
          >
            Confirmar turno
          </LoadingButton>
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
