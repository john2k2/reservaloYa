"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { bookingStatusOptions } from "@/app/admin/(panel)/bookings/booking-status-options";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 280;

type BookingsFiltersProps = {
  status: string;
  date: string;
  q: string;
};

function buildBookingsHref(
  filters: { q: string; status: string; date: string },
  nuevo: boolean
) {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  const status = filters.status.trim();
  const date = filters.date.trim();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (date) params.set("date", date);
  if (nuevo) params.set("nuevo", "1");
  const qs = params.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}

export function BookingsFilters({
  status: statusProp,
  date: dateProp,
  q: qProp,
}: BookingsFiltersProps) {
  const status = statusProp ?? "";
  const date = dateProp ?? "";
  const q = qProp ?? "";

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const statusSelectId = "booking-filters-status";
  const hasActiveFilters = Boolean(status || date || q);
  const keepNuevo = searchParams.get("nuevo") === "1";
  const filtersRef = useRef({ status, date, q });
  filtersRef.current = { status, date, q };

  useEffect(() => {
    setQuery(q);
  }, [q]);

  function navigate(next: { q: string; status: string; date: string }) {
    const href = buildBookingsHref(next, keepNuevo);
    const normalizedCurrent = buildBookingsHref(
      {
        q: searchParams.get("q") ?? "",
        status: searchParams.get("status") ?? "",
        date: searchParams.get("date") ?? "",
      },
      keepNuevo
    );
    if (href === normalizedCurrent) return;
    startTransition(() => {
      router.push(href);
    });
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === filtersRef.current.q) return;

    const timer = window.setTimeout(() => {
      const { status: currentStatus, date: currentDate } = filtersRef.current;
      navigate({ q: trimmed, status: currentStatus, date: currentDate });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // Solo reaccionamos a cambios de texto local; status/date van por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce de búsqueda
  }, [query]);

  return (
    <section
      className="rounded-xl border border-border/60 bg-background p-3 sm:p-4 shadow-sm"
      aria-busy={isPending}
    >
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente"
          className="h-10 sm:h-9 w-full sm:min-w-[180px] sm:flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
        />
        <div className="flex gap-2">
          <label htmlFor={statusSelectId} className="sr-only">
            Filtrar turnos por estado
          </label>
          <select
            id={statusSelectId}
            value={status}
            aria-label="Filtrar turnos por estado"
            onChange={(event) =>
              navigate({ q: query.trim(), status: event.target.value, date })
            }
            className="h-10 sm:h-9 flex-1 sm:w-36 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
          >
            <option value="">Estado</option>
            {bookingStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            aria-label="Filtrar por fecha"
            onChange={(event) =>
              navigate({ q: query.trim(), status, date: event.target.value })
            }
            className="h-10 sm:h-9 w-32 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-foreground/30"
          />
        </div>
        {hasActiveFilters && (
          <Link
            href={keepNuevo ? "/admin/bookings?nuevo=1" : "/admin/bookings"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 sm:h-9 px-2 flex-1 sm:flex-none justify-center"
            )}
          >
            Limpiar
          </Link>
        )}
      </div>
    </section>
  );
}
