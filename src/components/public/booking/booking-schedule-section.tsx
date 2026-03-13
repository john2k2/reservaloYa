"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { formatDateLabel } from "@/lib/bookings/format";
import { BookingDateTimePicker } from "@/components/public/booking/booking-date-time-picker";

type BookingScheduleSectionProps = {
  slug: string;
  serviceId: string;
  accentColor: string;
  initialSelectedDate: string;
  initialDateOptions: string[];
  rescheduleStartTime?: string;
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
}: BookingScheduleSectionProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      void fetch(
        `/api/public/booking-slots?slug=${encodeURIComponent(slug)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(selectedDate)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("No se pudieron cargar los horarios.");
          }

          return (await response.json()) as SlotsResponse;
        })
        .then((data) => {
          if (cancelled) return;
          setSlots(data.slots);
          setHasLoaded(true);
        })
        .catch(() => {
          if (cancelled) return;
          setSlots([]);
          setHasLoaded(true);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceId, slug]);

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
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Paso 2
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Elige día y hora
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          La página carga primero y los horarios reales aparecen enseguida al elegir una fecha.
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
        isLoading={!hasLoaded || isPending}
      />
    </section>
  );
}
