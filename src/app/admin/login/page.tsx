import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/login/actions";
import { demoBusinessOptions, productName } from "@/constants/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
            {productName}
          </Link>

          <div className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">Ingresar a tu negocio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {configured
                ? "Inicia sesión con tu correo electrónico."
                : "Modo demo activo. Puedes entrar al panel o probar cualquiera de las demos públicas."}
            </p>
          </div>

          {params.error && (
            <div className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {params.error}
            </div>
          )}

          <div className="mt-8">
            {configured ? (
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
                    placeholder="Ej: correo@negocio.com…"
                    className="minimalist-input"
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
                    autoComplete="current-password"
                    placeholder="Escribe tu contraseña…"
                    className="minimalist-input"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 w-full rounded-md bg-foreground font-medium text-background transition-transform active:scale-[0.98]"
                >
                  Iniciar sesión
                </button>
              </form>
            ) : (
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
                  Crear negocio desde demo
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
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center border-l border-border/60 bg-secondary/30 lg:flex">
        <div className="absolute inset-0 subtle-grid opacity-20 mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Administración sin ruido visual.</h2>
          <p className="text-lg text-muted-foreground">
            Una herramienta diseñada para que gestiones turnos, servicios y clientes con claridad desde la primera demo.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
              <p className="text-2xl font-semibold tracking-tight">2</p>
              <p className="mt-1 text-sm text-muted-foreground">Verticales demo listas</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
              <p className="text-2xl font-semibold tracking-tight">24/7</p>
              <p className="mt-1 text-sm text-muted-foreground">Reserva online disponible</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
