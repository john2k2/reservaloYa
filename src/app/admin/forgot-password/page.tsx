import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { forgotPasswordAction } from "@/app/login/actions";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { LoadingButton } from "@/components/ui/loading-button";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";

export const metadata: Metadata = {
  title: "Recuperar contraseña · ReservaYa",
  description: "Ingresá tu correo y te enviaremos un enlace para definir una nueva contraseña.",
  robots: { index: false, follow: false },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  const user = await getAuthenticatedSupabaseUser();
  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <main
      id="main-content"
      className="landing-theme flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
    >
      <div className="flex w-full flex-col justify-start pt-10 px-8 py-10 sm:justify-center sm:px-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex h-11 items-center" aria-label="Ir al inicio de ReservaYa">
            <ReservaYaLogo size="md" />
          </Link>

          <div className="mt-12 space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Recuperar contraseña</h1>
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
              className="mt-6 rounded-md border border-rule bg-secondary p-4 text-sm text-foreground"
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
            >
              Enviar enlace de recuperacion
            </LoadingButton>
          </form>

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
        <div className="absolute inset-0 subtle-grid opacity-20" />
        <div className="relative max-w-lg p-12">
          <h2 className="mb-4 font-display text-3xl font-semibold tracking-tight">Recuperá el acceso rápido</h2>
          <p className="text-lg text-muted-foreground">
            Te enviamos un enlace seguro al correo registrado para que puedas definir una nueva contraseña sin perder tiempo.
          </p>
        </div>
      </div>
    </main>
  );
}
