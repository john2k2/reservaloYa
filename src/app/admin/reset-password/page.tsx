import Link from "next/link";
import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/admin/login/actions";
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
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <Link href="/" className="inline-flex h-11 items-center text-2xl font-bold tracking-tight">
          {productName}
        </Link>

        <div className="mt-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nueva contrasena</h1>
          <p className="text-sm text-muted-foreground">
            Define una nueva contrasena para volver a entrar al panel.
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
            Falta el token de recuperacion. Abre el enlace que recibiste por correo.
          </div>
        ) : (
          <form action={resetPasswordAction} className="mt-8 space-y-6">
            <input type="hidden" name="token" value={params.token} />

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Nueva contrasena
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
                Repite la contrasena
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repite tu nueva contrasena"
                className="minimalist-input"
                required
              />
            </div>

            <LoadingButton
              pendingLabel="Actualizando contrasena..."
              className="h-12 w-full rounded-md bg-foreground font-medium text-background"
              disabled={!configured}
            >
              Guardar nueva contrasena
            </LoadingButton>
          </form>
        )}

        <div className="mt-6">
          <Link
            href="/admin/login"
            className="inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </main>
  );
}
