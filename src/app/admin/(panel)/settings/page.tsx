import Link from "next/link";
import { ExternalLink, Settings2, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getAdminSettingsData } from "@/server/queries/admin";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const settings = await getAdminSettingsData();
  const params = await searchParams;
  const savedMessage = params.saved ?? "";
  const errorMessage = params.error ?? "";

  return (
    <div className="flex flex-col items-center space-y-8">
      <section className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
            <Settings2 aria-hidden="true" className="size-5 text-foreground" />
          </div>
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ajustes
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              La identidad de la pagina ahora se configura completa desde onboarding para no
              repartir el mismo trabajo en dos lugares.
            </p>
          </div>
        </div>
      </section>

      {(savedMessage || errorMessage) && (
        <section className="w-full">
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              errorMessage
                ? "border-destructive/20 bg-destructive/10 text-destructive"
                : "border-border/60 bg-card text-card-foreground"
            )}
          >
            {errorMessage || savedMessage}
          </div>
        </section>
      )}

      <section className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Punto unico de configuracion
          </div>

          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-card-foreground">
            Todo lo visual vive en onboarding
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ahi defines estilo, fotos, portada, textos publicos, links y mapa. La idea es que una
            persona no tecnica haga todo en un solo flujo guiado.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Negocio activo
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">{settings.businessName}</p>
              <p className="mt-1 text-sm text-muted-foreground">/{settings.businessSlug}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado visual
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Si quieres cambiar look, fotos o copy, entra al onboarding.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/onboarding"
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11")}
            >
              Ir a onboarding
            </Link>
            <Link
              href={settings.publicUrl}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2")}
            >
              Ver pagina publica
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-card-foreground">Que queda aca</h3>
            <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Esta pantalla queda reservada para ajustes mas operativos.</p>
              <p>Ejemplos:</p>
              <p>integraciones reales</p>
              <p>politicas avanzadas</p>
              <p>paso de demo a modo real</p>
            </div>
          </article>

          <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-card-foreground">Regla de UX</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Si la tarea cambia la pagina publica, el usuario la hace en onboarding. Si cambia
              operacion interna, va en ajustes.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
