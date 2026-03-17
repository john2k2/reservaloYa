import { redirect } from "next/navigation";

import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminTeamData } from "@/server/queries/admin";
import { createStaffAction, updateStaffStatusAction } from "./actions";

type AdminTeamPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminTeamPage({ searchParams }: AdminTeamPageProps) {
  const shellData = await requireAdminRouteAccess("/admin/team");
  const params = await searchParams;

  if (!shellData || shellData.demoMode) {
    redirect("/admin/dashboard");
  }

  const members = await getAdminTeamData();

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Equipo</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Crea usuarios de staff para operar el negocio sin compartir la cuenta principal.
        </p>
      </header>

      {(params.error || params.success) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            params.error
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-success/20 bg-success/10 text-success"
          )}
          role="alert"
        >
          {params.error || params.success}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Agregar staff</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El staff puede operar agenda, servicios y clientes. El owner mantiene el control del equipo.
          </p>

          <form action={createStaffAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                className="minimalist-input"
                placeholder="Ej: Sofia Recepcion"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="minimalist-input"
                placeholder="staff@negocio.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña temporal
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="minimalist-input"
                placeholder="Minimo 8 caracteres"
                required
              />
            </div>

            <LoadingButton
              pendingLabel="Creando usuario..."
              className="h-12 w-full rounded-md bg-foreground font-medium text-background"
            >
              Crear usuario de staff
            </LoadingButton>
          </form>
        </article>

        <article className="rounded-xl border border-border/60 bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Miembros del equipo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Puedes activar o desactivar accesos sin tocar la cuenta principal.
          </p>

          <div className="mt-6 space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{member.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          member.role === "owner"
                            ? "bg-foreground text-background"
                            : "bg-secondary text-foreground"
                        )}
                      >
                        {member.role}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          member.active
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {member.active ? "Activo" : "Inactivo"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          member.verified
                            ? "bg-secondary text-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {member.verified ? "Verificado" : "Sin verificar"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{member.email}</p>
                  </div>

                  {member.role !== "owner" ? (
                    <form action={updateStaffStatusAction}>
                      <input type="hidden" name="userId" value={member.id} />
                      <input type="hidden" name="nextActive" value={String(!member.active)} />
                      <LoadingButton
                        pendingLabel="Guardando..."
                        className={cn(
                          "h-11 rounded-md px-4 font-medium",
                          member.active
                            ? "bg-destructive text-white"
                            : "bg-foreground text-background"
                        )}
                      >
                        {member.active ? "Desactivar" : "Activar"}
                      </LoadingButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
