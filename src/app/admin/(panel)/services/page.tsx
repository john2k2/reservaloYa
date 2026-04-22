import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, ExternalLink } from "lucide-react";

import { deactivateServiceAction } from "@/app/admin/(panel)/services/actions";
import { ServiceDeleteButton } from "@/app/admin/(panel)/services/service-delete-button";
import { ServiceForm } from "@/app/admin/(panel)/services/service-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminServicesData, getAdminShellData } from "@/server/queries/admin";

type AdminServicesPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminServicesPage({ searchParams }: AdminServicesPageProps) {
  const [services, shellData, params] = await Promise.all([
    getAdminServicesData(),
    getAdminShellData(),
    searchParams,
  ]);

  if (services === null || shellData === null) {
    redirect("/admin/onboarding");
  }

  const editingService = services.find((s) => s.id === params.edit) ?? null;
  const featuredCount = services.filter((s) => s.featured).length;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Servicios
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona lo que ofrecés en tu página de reservas.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-medium">
            {services.length} activos
          </span>
          {featuredCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {featuredCount} destacados
            </span>
          )}
        </div>
      </header>

      {/* Layout de 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulario */}
        <ServiceForm editingService={editingService} />

        {/* Lista de servicios */}
        <section className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
          <div className="border-b border-border/60 px-5 py-4">
            <h2 className="font-semibold text-foreground">Catálogo activo</h2>
            <p className="text-xs text-muted-foreground">
              Desactivar oculta el servicio de la reserva pública.
            </p>
          </div>

          {services.length > 0 ? (
            <div className="divide-y divide-border/60">
              {services.map((service) => {
                const isEditing = editingService?.id === service.id;
                return (
                  <article key={service.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          {service.featured && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              {service.featuredLabel || "Destacado"}
                            </span>
                          )}
                          {isEditing && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                              Editando
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {service.description || "Sin descripción."}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-xs">
                            <Clock3 className="size-3" />
                            {service.durationMinutes} min
                          </span>
                          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium">
                            {service.priceLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col">
                        <Link
                          href={`/admin/services?edit=${service.id}`}
                          className={cn(
                            buttonVariants({ variant: isEditing ? "secondary" : "outline", size: "sm" }),
                            "h-8"
                          )}
                        >
                          {isEditing ? "Editando..." : "Editar"}
                        </Link>
                        <form action={deactivateServiceAction}>
                          <input type="hidden" name="serviceId" value={service.id} />
                          <input type="hidden" name="serviceName" value={service.name} />
                          <ServiceDeleteButton />
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <p className="text-sm font-medium text-foreground">Todavía no cargaste servicios.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Crea tu primer servicio desde el formulario para que aparezca en la reserva pública.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Preview link */}
      {shellData && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/10 p-4">
          <p className="text-sm text-muted-foreground">
            Previsualizá cómo se ven tus servicios en la página pública.
          </p>
          <Link
            href={`/${shellData.businessSlug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
          >
            Ver página
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
