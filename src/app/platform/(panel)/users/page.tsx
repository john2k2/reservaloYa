import { Users } from "lucide-react";

import { getPlatformUsersList } from "@/server/queries/platform";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios · Platform" };

const roleLabels: Record<string, string> = {
  owner: "Dueño",
  admin: "Admin",
  staff: "Personal",
};

export default async function PlatformUsersPage() {
  let users;
  try {
    users = await getPlatformUsersList();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive text-sm">
        Error al cargar datos: {msg}
      </div>
    );
  }

  if (!users) {
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
          <Users className="size-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Plataforma</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <span className="text-sm text-muted-foreground">{users.length} total</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Usuario</span>
          <span>Negocio</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Verificado</span>
        </div>

        <div className="divide-y divide-border/40">
          {users.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No hay usuarios registrados.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 md:gap-4 items-center px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(u.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm truncate">{u.businessName}</p>
                  <p className="text-xs text-muted-foreground">/{u.businessSlug}</p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {roleLabels[u.role] ?? u.role}
                </span>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    u.active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {u.active ? "Activo" : "Inactivo"}
                </span>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    u.verified
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {u.verified ? "Verificado" : "Pendiente"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
