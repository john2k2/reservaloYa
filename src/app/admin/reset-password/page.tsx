import Link from "next/link";
import { redirect } from "next/navigation";

import { productName } from "@/constants/site";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getAuthenticatedSupabaseUser();
  if (user) {
    redirect("/admin/dashboard");
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
              Definí una nueva contraseña para volver a entrar al panel.
            </p>
          </div>

          <ResetPasswordForm />

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
