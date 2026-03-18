import { Building2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { getPlatformBusinessesList } from "@/server/queries/platform";

export const dynamic = "force-dynamic";

export const metadata = { title: "Negocios · Platform" };

export default async function PlatformBusinessesPage() {
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
        Panel de plataforma no disponible en modo local.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Building2 className="size-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Plataforma</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Negocios</h1>
          <span className="text-sm text-muted-foreground">{businesses.length} total</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Negocio</span>
          <span>Responsable</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        <div className="divide-y divide-border/40">
          {businesses.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No hay negocios registrados.
            </p>
          ) : (
            businesses.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-4 items-center px-6 py-4"
              >
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

                <div className="min-w-0">
                  <p className="text-sm truncate">{b.ownerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.ownerEmail}</p>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    b.active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {b.active ? "Activo" : "Inactivo"}
                </span>

                <Link
                  href={`/${b.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  Ver página
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
