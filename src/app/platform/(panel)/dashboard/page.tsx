import { BarChart2, Building2, CalendarCheck, TrendingUp, Users, CreditCard, Clock, AlertCircle, DollarSign, Ghost, Timer } from "lucide-react";
import Link from "next/link";

import { getPlatformDashboardData } from "@/server/queries/platform";
import { SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";

export const dynamic = "force-dynamic";

export const metadata = { title: "Platform Dashboard" };

export default async function PlatformDashboardPage() {
  let data;
  try {
    data = await getPlatformDashboardData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive text-sm">
        Error al cargar datos: {msg}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
        Panel de plataforma no disponible.
      </div>
    );
  }

  const kpis = [
    {
      label: "Negocios activos",
      value: data.activeBusinesses,
      sub: `${data.totalBusinesses} total`,
      icon: Building2,
    },
    {
      label: "Usuarios registrados",
      value: data.totalUsers,
      sub: "Admin y owners",
      icon: Users,
    },
    {
      label: "Reservas (30d)",
      value: data.bookingsLast30d,
      sub: "Últimos 30 días",
      icon: CalendarCheck,
    },
    {
      label: "Nuevos esta semana",
      value: data.newBusinessesThisWeek,
      sub: "Negocios creados",
      icon: TrendingUp,
    },
  ];

  const subscriptionKpis = [
    {
      label: "Suscripciones activas",
      value: data.subscriptionActive,
      sub: "Pagando mensual",
      icon: CreditCard,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "En período de prueba",
      value: data.subscriptionTrial,
      sub: "Trial activo",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Suspendidos / Cancelados",
      value: data.subscriptionSuspended,
      sub: "Churn",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "MRR estimado",
      value: data.mrr > 0 ? `$${data.mrr.toLocaleString("es-AR")}` : "—",
      sub: data.mrr > 0 ? `${data.subscriptionActive} × U$D ${SUBSCRIPTION_USD_PRICE} · dólar blue` : "Sin precio configurado",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BarChart2 className="size-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Plataforma</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* KPIs generales */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Suscripciones */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Suscripciones
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {subscriptionKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </span>
                  <div className={`rounded-full p-1.5 ${kpi.bg}`}>
                    <Icon className={`size-3.5 ${kpi.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trials expirando pronto */}
      {data.trialsExpiringSoon.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 border-b border-amber-500/20 px-6 py-4">
            <Timer className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold text-amber-800 dark:text-amber-300">
              Trials por vencer ({data.trialsExpiringSoon.length})
            </h2>
            <span className="text-xs text-amber-600 dark:text-amber-400">— próximos 7 días</span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {data.trialsExpiringSoon.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.ownerEmail}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {b.subscription.trialEndsAt && (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Vence {new Date(b.subscription.trialEndsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <Link
                    href="/platform/businesses"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Gestionar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negocios dormantes */}
      {data.dormantBusinesses.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
            <Ghost className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Negocios sin configurar ({data.dormantBusinesses.length})</h2>
            <span className="text-xs text-muted-foreground">— sin servicios o sin disponibilidad activa</span>
          </div>
          <div className="divide-y divide-border/40">
            {data.dormantBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.ownerEmail}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-[10px] text-muted-foreground">
                  <span>{b.servicesCount} servicio{b.servicesCount !== 1 ? "s" : ""}</span>
                  <span>{b.activeAvailabilityRules} regla{b.activeAvailabilityRules !== 1 ? "s" : ""} activa{b.activeAvailabilityRules !== 1 ? "s" : ""}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent businesses */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold">Negocios recientes</h2>
          <Link
            href="/platform/businesses"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-border/40">
          {data.recentBusinesses.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No hay negocios aún.
            </p>
          ) : (
            data.recentBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    /{b.slug} · {b.ownerEmail}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {b.subscription.status === "active" && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      Activo
                    </span>
                  )}
                  {b.subscription.status === "trial" && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Trial
                    </span>
                  )}
                  {(b.subscription.status === "suspended" ||
                    b.subscription.status === "cancelled") && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-red-500/10 text-red-600 dark:text-red-400">
                      Suspendido
                    </span>
                  )}
                  {b.subscription.status === "none" && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-secondary text-muted-foreground">
                      Sin sub
                    </span>
                  )}
                  <Link
                    href={`/${b.slug}`}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
