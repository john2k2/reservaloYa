import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { loginAction } from "@/app/login/actions";
import { productName } from "@/constants/site";
import { LoadingButton } from "@/components/ui/loading-button";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main
      id="main-content"
      className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
              {productName}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Volver al inicio
            </Link>
          </div>

          <div className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">Ingresar a tu negocio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Iniciá sesión con tu correo electrónico para gestionar tu negocio.
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
              className="mt-6 rounded-md border border-success/20 bg-success/10 p-4 text-sm text-success"
              role="status"
              aria-live="polite"
            >
              {params.success}
            </div>
          )}

          <div className="mt-8">
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
                  <p>¿Todavía no tenés cuenta?</p>
                  <Link
                    href="/admin/signup"
                    className="inline-flex min-h-11 items-center rounded-md font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
                  >
                    Creá tu negocio y empezá ahora
                  </Link>
                </div>
              </div>
            </div>
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
              <p className="text-2xl font-semibold tracking-tight">4</p>
              <p className="mt-1 text-sm text-muted-foreground">Negocios de ejemplo</p>
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
