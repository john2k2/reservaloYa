"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilLine, Plus, Sparkles } from "lucide-react";

import { saveServiceAction } from "@/app/admin/(panel)/services/actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";

type EditingService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  featured: boolean;
  featuredLabel: string | null;
};

export function ServiceForm({ editingService }: { editingService: EditingService | null }) {
  const [description, setDescription] = useState(editingService?.description ?? "");
  const [featuredLabel, setFeaturedLabel] = useState(editingService?.featuredLabel ?? "");
  const [featured, setFeatured] = useState(editingService?.featured ?? false);

  const descMaxLength = 240;
  const labelMaxLength = 24;

  return (
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
            {editingService
              ? "Modificá los datos del servicio."
              : "Agregá un servicio a tu catálogo."}
          </p>
        </div>
      </div>

      <form action={saveServiceAction} className="space-y-3">
        <input type="hidden" name="serviceId" value={editingService?.id ?? ""} />

        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-medium">
            Nombre
          </label>
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
          <div className="flex items-center justify-between">
            <label htmlFor="description" className="text-xs font-medium">
              Descripción
            </label>
            <span
              className={cn(
                "text-[10px] tabular-nums",
                description.length > descMaxLength * 0.9
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {description.length}/{descMaxLength}
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={descMaxLength}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Incluye lavado, corte y peinado con secador."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="durationMinutes" className="text-xs font-medium">
              Duración (min)
            </label>
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
            <label htmlFor="price" className="text-xs font-medium">
              Precio
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                ARS $
              </span>
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                defaultValue={
                  editingService?.price != null ? String(editingService.price) : ""
                }
                placeholder="5000"
                className="h-9 w-full rounded-md border border-border bg-background pl-12 pr-3 text-sm outline-none focus:border-foreground/30"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Dejá vacío si el precio varía.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              value="on"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border"
            />
            <div>
              <label
                htmlFor="featured"
                className="text-sm font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="size-3" /> Destacar servicio
              </label>
              <p className="text-[10px] text-muted-foreground">
                Máximo 3. Se muestran primero en tu página.
              </p>
            </div>
          </div>

          {featured && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="featuredLabel" className="text-xs font-medium">
                  Etiqueta (opcional)
                </label>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    featuredLabel.length > labelMaxLength * 0.9
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  )}
                >
                  {featuredLabel.length}/{labelMaxLength}
                </span>
              </div>
              <input
                id="featuredLabel"
                name="featuredLabel"
                type="text"
                maxLength={labelMaxLength}
                value={featuredLabel}
                onChange={(e) => setFeaturedLabel(e.target.value)}
                placeholder="Ej: Más elegido"
                className="h-8 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground/30"
              />
              <p className="text-[10px] text-muted-foreground">
                Aparece como badge sobre el servicio.
              </p>
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
  );
}
