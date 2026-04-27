"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateLabel } from "@/lib/bookings/format";
import { BookingDateTimePicker } from "@/components/public/booking/booking-date-time-picker";

type BookingScheduleSectionProps = {
  slug: string;
  serviceId: string;
  accentColor: string;
  initialSelectedDate: string;
  initialDateOptions: string[];
  todayDate: string;
  rescheduleStartTime?: string;
  onNoSlots?: (date: string | null) => void;
  onSelectSlot?: (slot: string) => void;
};

type SlotsState = {
  date: string;
  slots: string[];
};

type SlotsResponse = {
  bookingDate: string;
  slots: string[];
};

type LoadErrorState = {
  date: string;
  message: string;
};

export function BookingScheduleSection({
  slug,
  serviceId,
  accentColor,
  initialSelectedDate,
  initialDateOptions,
  todayDate,
  rescheduleStartTime,
  onNoSlots,
  onSelectSlot,
}: BookingScheduleSectionProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  // Tracks which date's slots are loaded — null means "not yet loaded"
  const [loadedSlots, setLoadedSlots] = useState<SlotsState | null>(null);
  const [loadError, setLoadError] = useState<LoadErrorState | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetch(
      `/api/public/booking-slots?slug=${encodeURIComponent(slug)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(selectedDate)}`,
      { method: "GET", cache: "no-store" }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los horarios.");
        return (await response.json()) as SlotsResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setLoadedSlots({ date: selectedDate, slots: data.slots });
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadedSlots(null);
        setLoadError({
          date: selectedDate,
          message: error instanceof Error ? error.message : "No se pudieron cargar los horarios.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceId, slug, retryNonce]);

  // Show loading skeleton whenever the loaded date doesn't match the selected date
  const currentLoadError = loadError?.date === selectedDate ? loadError.message : null;
  const isLoading = !currentLoadError && (loadedSlots === null || loadedSlots.date !== selectedDate);
  const slots = isLoading || currentLoadError || !loadedSlots ? [] : loadedSlots.slots;

  // Notify parent when slots state is resolved
  useEffect(() => {
    if (!onNoSlots) return;
    if (isLoading) return;
    if (currentLoadError) return;
    onNoSlots(slots.length === 0 ? selectedDate : null);
  }, [isLoading, currentLoadError, slots.length, selectedDate, onNoSlots]);

  const dateOptions = useMemo(
    () =>
      initialDateOptions.map((value) => ({
        value,
        isSelected: value === selectedDate,
        isToday: value === todayDate,
      })),
    [initialDateOptions, selectedDate, todayDate]
  );

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-3 shadow-sm sm:p-4">
      <input type="hidden" name="bookingDate" value={selectedDate} />

      <div className="mb-4 px-2 pt-2 sm:px-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Elegí día y hora
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Solo días con disponibilidad real. Elegí una fecha y después el horario.
        </p>
      </div>

      <BookingDateTimePicker
        accentColor={accentColor}
        dateOptions={dateOptions}
        todayDate={todayDate}
        selectedDate={selectedDate}
        selectedDateLabel={formatDateLabel(selectedDate)}
        slots={slots}
        rescheduleStartTime={rescheduleStartTime}
        onSelectDate={setSelectedDate}
        onSelectSlot={onSelectSlot}
        isLoading={isLoading}
      />

      {currentLoadError ? (
        <div className="mx-2 mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground sm:mx-3">
          <p className="font-medium">No pudimos cargar los horarios.</p>
          <p className="mt-1 text-muted-foreground">Reintentá en unos segundos. No vamos a activar la lista de espera por este error.</p>
          <button
            type="button"
            className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            onClick={() => setRetryNonce((value) => value + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </section>
  );
}
