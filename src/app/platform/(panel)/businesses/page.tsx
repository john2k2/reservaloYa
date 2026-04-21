import { Building2, ExternalLink, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

import { getPlatformBusinessesList, type PlatformSubscriptionInfo } from "@/server/queries/platform";
import { BusinessSearchFilter } from "./business-search-filter";
import { ToggleBusinessButton } from "./toggle-business-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Negocios · Platform" };

function SubscriptionBadge({ sub }: { sub: PlatformSubscriptionInfo }) {
  const now = new Date();

  if (sub.status === "active") {
    const nextBilling = sub.nextBillingDate ? new Date(sub.nextBillingDate) : null;
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          Activo
        </span>
        {nextBilling && (
          <span className="text-[10px] text-muted-foreground">
            Vence {nextBilling.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    );
  }

  if (sub.status === "trial") {
    const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
    const expired = trialEnd ? trialEnd < now : false;
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${expired ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
          {expired ? "Trial vencido" : "Trial"}
        </span>
        {trialEnd && (
          <span className="text-[10px] text-muted-foreground">
            {expired ? "Venció" : "Vence"} {trialEnd.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    );
  }

  if (sub.status === "suspended" || sub.status === "cancelled") {
    return (
      <span className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-red-500/10 text-red-600 dark:text-red-400">
        {sub.status === "suspended" ? "Suspendido" : "Cancelado"}
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-secondary text-muted-foreground">
      Sin suscripción
    </span>
  );
}

export default async function PlatformBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;

  let businesses;
  try {
    businesses = await getPlatformBusinessesList();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive text-sm">
        Error al cargar datos: {msg}
      </div>
    );
  }

  if (!businesses) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
        Panel de plataforma no disponible.
      </div>
    );
  }

  // Filtros client-side (la lista no crece tanto)
  const filtered = businesses.filter((b) => {
    const matchesQ =
      !q ||
      b.name.toLowerCase().includes(q.toLowerCase()) ||
      b.slug.toLowerCase().includes(q.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(q.toLowerCase());

    const matchesStatus =
      !status ||
      (status === "active" && b.subscription.status === "active") ||
      (status === "trial" && b.subscription.status === "trial") ||
      (status === "suspended" &&
        (b.subscription.status === "suspended" || b.subscription.status === "cancelled")) ||
      (status === "inactive" && !b.active);

    return matchesQ && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Building2 className="size-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Plataforma</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {businesses.length}
          </span>
        </div>
      </div>

      <BusinessSearchFilter currentQ={q} currentStatus={status} />

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <div className="hidden lg:grid grid-cols-[1.5fr_1fr_120px_60px_80px_100px] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Negocio</span>
          <span>Responsable</span>
          <span>Suscripción</span>
          <span>MP</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        <div className="divide-y divide-border/40">
          {filtered.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No hay negocios que coincidan con el filtro.
            </p>
          ) : (
            filtered.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_120px_60px_80px_100px] gap-3 lg:gap-4 items-center px-6 py-4"
              >
                {/* Negocio */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">/{b.slug}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(b.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Responsable */}
                <div className="min-w-0">
                  <p className="text-sm truncate">{b.ownerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.ownerEmail}</p>
                </div>

                {/* Suscripción */}
                <SubscriptionBadge sub={b.subscription} />

                {/* MP Conectado */}
                <div>
                  {b.mpConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Wifi className="size-3" />
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <WifiOff className="size-3" />
                      No
                    </span>
                  )}
                </div>

                {/* Estado activo/inactivo */}
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    b.active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {b.active ? "Activo" : "Inactivo"}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/${b.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    Ver
                  </Link>
                  <ToggleBusinessButton
                    businessId={b.id}
                    active={b.active}
                    businessName={b.name}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
