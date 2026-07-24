import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { ResetPasswordForm } from "./reset-password-form";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Nueva contraseña · ReservaYa",
  path: "/admin/reset-password",
  description: "Definí una nueva contraseña para volver a entrar al panel.",
});

export default async function ResetPasswordPage() {
  const user = await getAuthenticatedSupabaseUser();
  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <AuthSplitLayout
      panelTitle="Volvé a entrar seguro"
      panelDescription="Elegí una contraseña nueva y segura para tu panel. Si necesitás ayuda, escribinos."
    >
      <div className="mt-12 space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Nueva contraseña</h1>
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
    </AuthSplitLayout>
  );
}
