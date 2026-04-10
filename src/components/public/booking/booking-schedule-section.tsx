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

export function BookingScheduleSection({
  slug,
  serviceId,
  accentColor,
  initialSelectedDate,
  initialDateOptions,
  rescheduleStartTime,
  onNoSlots,
  onSelectSlot,
}: BookingScheduleSectionProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  // Tracks which date's slots are loaded — null means "not yet loaded"
  const [loadedSlots, setLoadedSlots] = useState<SlotsState | null>(null);

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
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedSlots({ date: selectedDate, slots: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceId, slug]);

  // Show loading skeleton whenever the loaded date doesn't match the selected date
  const isLoading = loadedSlots === null || loadedSlots.date !== selectedDate;
  const slots = isLoading ? [] : loadedSlots.slots;

  // Notify parent when slots state is resolved
  useEffect(() => {
    if (!onNoSlots) return;
    if (isLoading) return;
    onNoSlots(slots.length === 0 ? selectedDate : null);
  }, [isLoading, slots.length, selectedDate, onNoSlots]);

  const dateOptions = useMemo(
    () =>
      initialDateOptions.map((value) => ({
        value,
        isSelected: value === selectedDate,
        isToday: value === new Date().toISOString().slice(0, 10),
      })),
    [initialDateOptions, selectedDate]
  );

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-3 shadow-sm sm:p-4">
      <input type="hidden" name="bookingDate" value={selectedDate} />

      <div className="mb-4 px-2 pt-2 sm:px-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Elige día y hora
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Solo días con disponibilidad real. Selecciona una fecha y después el horario.
        </p>
      </div>

      <BookingDateTimePicker
        accentColor={accentColor}
        dateOptions={dateOptions}
        selectedDate={selectedDate}
        selectedDateLabel={formatDateLabel(selectedDate)}
        slots={slots}
        rescheduleStartTime={rescheduleStartTime}
        onSelectDate={setSelectedDate}
        onSelectSlot={onSelectSlot}
        isLoading={isLoading}
      />
    </section>
  );
}
