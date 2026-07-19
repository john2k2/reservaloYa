"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const SEARCH_DEBOUNCE_MS = 280;

type CustomersSearchProps = {
  q: string;
};

export function CustomersSearch({ q: qProp }: CustomersSearchProps) {
  const q = qProp ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === q) return;

    const timer = window.setTimeout(() => {
      const href = trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname;
      startTransition(() => {
        router.push(href);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, q, pathname, router]);

  return (
    <section
      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
      aria-busy={isPending}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          aria-label="Buscar clientes"
          className="h-9 w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-foreground/30"
        />
      </div>
    </section>
  );
}
