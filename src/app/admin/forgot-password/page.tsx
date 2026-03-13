import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordAction } from "@/app/admin/login/actions";
import { LoadingButton } from "@/components/ui/loading-button";
import { productName } from "@/constants/site";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
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
          <h1 className="text-3xl font-bold tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu correo y te enviaremos un enlace para definir una nueva contraseña.
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

        {params.success && (
          <div
            className="mt-6 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700"
            role="status"
            aria-live="polite"
          >
            {params.success}
          </div>
        )}

        <form action={forgotPasswordAction} className="mt-8 space-y-6">
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
            />
          </div>

          <LoadingButton
            pendingLabel="Enviando instrucciones..."
            className="h-12 w-full rounded-md bg-foreground font-medium text-background"
            disabled={!configured}
          >
            Enviar enlace de recuperacion
          </LoadingButton>
        </form>

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
