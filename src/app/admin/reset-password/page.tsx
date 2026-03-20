import Link from "next/link";
import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/login/actions";
import { LoadingButton } from "@/components/ui/loading-button";
import { productName } from "@/constants/site";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
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
      <div className="flex w-full flex-col justify-start pt-10 px-8 py-10 sm:justify-center sm:px-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
            {productName}
          </Link>

          <div className="mt-12 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Nueva contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Define una nueva contraseña para volver a entrar al panel.
            </p>
          </div>

          {params.error && (
            <div
              className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {params.error}
            </div>
          )}

          {!params.token ? (
            <div className="mt-8 rounded-md border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Falta el token de recuperación. Abre el enlace que recibiste por correo.
            </div>
          ) : (
            <form action={resetPasswordAction} className="mt-8 space-y-6">
              <input type="hidden" name="token" value={params.token} />

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  className="minimalist-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="passwordConfirm" className="text-sm font-medium text-foreground">
                  Repite la contraseña
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite tu nueva contraseña"
                  className="minimalist-input"
                  required
                />
              </div>

              <LoadingButton
                pendingLabel="Actualizando contraseña..."
                className="h-12 w-full rounded-md bg-foreground font-medium text-background"
                disabled={!configured}
              >
                Guardar nueva contraseña
              </LoadingButton>
            </form>
          )}

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-foreground underline underline-offset-4"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center border-l border-border/60 bg-secondary/30 lg:flex">
        <div className="absolute inset-0 subtle-grid opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">Volvé a entrar seguro</h2>
          <p className="text-lg text-muted-foreground">
            Elegí una contraseña nueva y segura para tu panel. Si necesitás ayuda, escribinos.
          </p>
        </div>
      </div>
    </main>
  );
}
