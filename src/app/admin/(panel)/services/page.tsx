import Link from "next/link";
import { Clock3, ExternalLink, PencilLine, Plus, Sparkles } from "lucide-react";

import {
  deactivateServiceAction,
  saveServiceAction,
} from "@/app/admin/(panel)/services/actions";
import { ServiceDeleteButton } from "@/app/admin/(panel)/services/service-delete-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import { getAdminServicesData, getAdminShellData } from "@/server/queries/admin";

type AdminServicesPageProps = {
  searchParams: Promise<{
    edit?: string;
    saved?: string;
    archived?: string;
    error?: string;
  }>;
};

function getPriceInputValue(price: number | null) {
  return price == null ? "" : String(price);
}

function buildNotice(params: {
  saved?: string;
  archived?: string;
  error?: string;
}) {
  if (params.error) return { tone: "error" as const, message: params.error };
  if (params.saved) return { tone: "success" as const, message: `Servicio guardado: ${params.saved}.` };
  if (params.archived) return { tone: "success" as const, message: `Servicio desactivado: ${params.archived}.` };
  return null;
}

export default async function AdminServicesPage({ searchParams }: AdminServicesPageProps) {
  const [services, shellData, params] = await Promise.all([
    getAdminServicesData(),
    getAdminShellData(),
    searchParams,
  ]);
  const editingService = services.find((s) => s.id === params.edit) ?? null;
  const notice = buildNotice(params);
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

      {notice && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.tone === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          )}
          role="alert"
        >
          {notice.message}
        </div>
      )}

      {/* Layout de 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulario */}
        <section className="rounded-xl border border-border/60 bg-background p-5 shadow-sm h-fit">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-secondary p-2">
              {editingService ? <PencilLine className="size-4" /> : <Plus className="size-4" />}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {editingService ? "Editar servicio" : "Nuevo servicio"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingService ? "Modificá los datos del servicio." : "Agregá un servicio a tu catálogo."}
              </p>
            </div>
          </div>

          <form action={saveServiceAction} className="space-y-3">
            <input type="hidden" name="serviceId" value={editingService?.id ?? ""} />

            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-medium">Nombre</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={80}
                defaultValue={editingService?.name ?? ""}
                placeholder="Ej: Corte clásico"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="text-xs font-medium">Descripción</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={240}
                defaultValue={editingService?.description ?? ""}
                placeholder="¿Qué incluye el servicio?"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="durationMinutes" className="text-xs font-medium">Duración (min)</label>
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  required
                  min={5}
                  max={480}
                  step={5}
                  defaultValue={editingService?.durationMinutes ?? 30}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="price" className="text-xs font-medium">Precio</label>
                <input
                  id="price"
                  name="price"
                  type="text"
                  inputMode="decimal"
                  defaultValue={getPriceInputValue(editingService?.price ?? null)}
                  placeholder="18000"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  value="on"
                  defaultChecked={editingService?.featured ?? false}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <div>
                  <label htmlFor="featured" className="text-sm font-medium flex items-center gap-1">
                    <Sparkles className="size-3" /> Destacar servicio
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Máximo 3 destacados. Se muestran primero.
                  </p>
                </div>
              </div>
              
              {(editingService?.featured || !editingService) && (
                <div className="space-y-1">
                  <label htmlFor="featuredLabel" className="text-xs font-medium">Etiqueta (opcional)</label>
                  <input
                    id="featuredLabel"
                    name="featuredLabel"
                    type="text"
                    maxLength={24}
                    defaultValue={editingService?.featuredLabel ?? ""}
                    placeholder="Más elegido"
                    className="h-8 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <LoadingButton className="h-9 flex-1 text-sm">
                {editingService ? "Guardar cambios" : "Crear servicio"}
              </LoadingButton>
              {editingService && (
                <Link
                  href="/admin/services"
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        </section>

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
