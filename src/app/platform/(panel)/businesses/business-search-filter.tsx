"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "trial", label: "En trial" },
  { value: "suspended", label: "Suspendidos" },
  { value: "inactive", label: "Inactivos" },
];

export function BusinessSearchFilter({
  currentQ,
  currentStatus,
}: {
  currentQ: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function update(q: string, status: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, slug o email..."
          defaultValue={currentQ}
          onChange={(e) => update(e.target.value, currentStatus)}
          className="w-full rounded-xl border border-border/60 bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update(currentQ, opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              currentStatus === opt.value
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
