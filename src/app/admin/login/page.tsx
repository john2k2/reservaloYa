import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/login/actions";
import { demoBusinessOptions, productName } from "@/constants/site";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import { isDemoModeEnabled } from "@/lib/runtime";
import { LoadingButton } from "@/components/ui/loading-button";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const configured = isPocketBaseConfigured();
  const demoModeEnabled = isDemoModeEnabled();

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
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
            {productName}
          </Link>

          <div className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">Ingresar a tu negocio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {configured
                ? "Iniciá sesión con tu correo electrónico para gestionar tu negocio."
                : demoModeEnabled
                  ? "Modo demo activo. Explora el panel de administración sin necesidad de crear una cuenta."
                  : "El acceso admin está deshabilitado hasta conectar la autenticación real."}
            </p>
          </div>

          {params.error && (
            <div
              className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
              aria-live="polite"
              id="login-error"
            >
              {params.error}
            </div>
          )}

          {params.success && (
            <div
              className="mt-6 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {params.success}
            </div>
          )}

          <div className="mt-8">
            {configured ? (
              <div className="space-y-6">
                <form action={loginAction} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="tu@negocio.com"
                      className="minimalist-input"
                      required
                      aria-invalid={params.error ? "true" : undefined}
                      aria-describedby={params.error ? "login-error" : undefined}
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
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      className="minimalist-input"
                      required
                      aria-invalid={params.error ? "true" : undefined}
                      aria-describedby={params.error ? "login-error" : undefined}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href="/admin/forgot-password"
                      className="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-foreground underline underline-offset-4"
                    >
                      Olvidé mi contraseña
                    </Link>
                  </div>
                  <LoadingButton
                    pendingLabel="Iniciando sesión..."
                    className="h-12 w-full rounded-md bg-foreground font-medium text-background"
                  >
                    Iniciar sesión
                  </LoadingButton>
                </form>

                <div className="rounded-xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p>¿Todavía no tienes cuenta?</p>
                    <Link
                      href="/admin/signup"
                      className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-foreground underline underline-offset-4"
                    >
                      Crea tu negocio y empieza ahora
                    </Link>
                  </div>
                </div>
              </div>
            ) : demoModeEnabled ? (
              <div className="space-y-4">
                <Link
                  href="/admin/dashboard"
                  className="flex h-12 w-full items-center justify-center rounded-md bg-foreground font-medium text-background transition-transform hover:bg-foreground/90 active:scale-[0.98]"
                >
                  Entrar al panel demo
                </Link>
                <Link
                  href="/admin/onboarding"
                  className="flex h-12 w-full items-center justify-center rounded-md border border-border/70 bg-card font-medium text-foreground transition-colors hover:bg-secondary/20"
                >
                  Crear negocio desde una plantilla
                </Link>
                <div className="grid gap-3 sm:grid-cols-2">
                  {demoBusinessOptions.map((option) => (
                    <Link
                      key={option.slug}
                      href={`/${option.slug}`}
                      className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <p className="text-sm font-semibold text-card-foreground">{option.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {option.category}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
                <p>El panel interno no se expone por defecto mientras seguimos con el modo local.</p>
                <p>Puedes seguir probando la parte pública desde las demos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center border-l border-border/60 bg-secondary/30 lg:flex">
        <div className="absolute inset-0 subtle-grid opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Gestión sin complicaciones</h2>
          <p className="text-lg text-muted-foreground">
            Una herramienta pensada para que administres turnos, servicios y clientes con claridad
            desde el primer día.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
              <p className="text-2xl font-semibold tracking-tight">2</p>
              <p className="mt-1 text-sm text-muted-foreground">Verticales demo listas</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
              <p className="text-2xl font-semibold tracking-tight">24/7</p>
              <p className="mt-1 text-sm text-muted-foreground">Reservas online disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
