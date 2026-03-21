import Link from "next/link";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/login/actions";
import { demoBusinessOptions, productName } from "@/constants/site";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import { LoadingButton } from "@/components/ui/loading-button";

type AdminSignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSignupPage({ searchParams }: AdminSignupPageProps) {
  const params = await searchParams;
  const configured = isPocketBaseConfigured();

  if (configured) {
    const pb = await createPocketBaseServerClient();
    const isAuthenticated = await refreshPocketBaseAuth(pb);

    if (isAuthenticated && pb.authStore.record) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
            {productName}
          </Link>

          <div className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta y tu negocio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Completa los datos iniciales y entra directo a configurar tu página y tu panel.
            </p>
          </div>

          {params.error && (
            <div
              className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
              aria-live="polite"
              id="signup-error"
            >
              {params.error}
            </div>
          )}

          {configured ? (
            <form action={signupAction} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="ownerName" className="text-sm font-medium text-foreground">
                    Tu nombre
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    autoComplete="name"
                    className="minimalist-input"
                    placeholder="Ej: Juan Perez"
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
                    placeholder="tu@negocio.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium text-foreground">
                  Nombre del negocio
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  autoComplete="organization"
                  className="minimalist-input"
                  placeholder="Ej: Aura Studio Palermo"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="businessSlug" className="text-sm font-medium text-foreground">
                    Link público
                  </label>
                  <input
                    id="businessSlug"
                    name="businessSlug"
                    autoComplete="off"
                    className="minimalist-input"
                    placeholder="aura-studio"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="templateSlug" className="text-sm font-medium text-foreground">
                    Tipo de negocio
                  </label>
                  <select
                    id="templateSlug"
                    name="templateSlug"
                    className="minimalist-input"
                    defaultValue={demoBusinessOptions[0]?.slug}
                    required
                  >
                    {demoBusinessOptions.map((option) => (
                      <option key={option.slug} value={option.slug}>
                        {option.label} - {option.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    WhatsApp
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    className="minimalist-input"
                    placeholder="+54 11 5555 0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Contraseña
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
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium text-foreground">
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  className="minimalist-input"
                  placeholder="Ej: Honduras 4821, Palermo"
                  required
                />
              </div>

              <LoadingButton
                pendingLabel="Creando cuenta..."
                className="h-12 w-full rounded-md bg-foreground font-medium text-background"
              >
                Crear cuenta y empezar
              </LoadingButton>
            </form>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
                El registro no está disponible en este entorno. Podés explorar el demo sin crear cuenta.
              </div>
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.98]"
              >
                Ir al demo
              </Link>
            </div>
          )}

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>¿Ya tienes cuenta?</p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-foreground underline underline-offset-4"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center border-l border-border/60 bg-secondary/30 lg:flex">
        <div className="absolute inset-0 subtle-grid opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Entras y sales vendiendo</h2>
          <p className="text-lg text-muted-foreground">
            El objetivo es que tu negocio tenga su página pública, panel y agenda listos en minutos,
            sin depender de una configuración manual.
          </p>
        </div>
      </div>
    </main>
  );
}
