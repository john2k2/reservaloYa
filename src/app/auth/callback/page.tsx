import Link from "next/link";
import type { Metadata } from "next";

import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { sanitizeAuthCallbackNextPath } from "@/server/auth-callback";
import { AuthCallbackClient } from "./auth-callback-client";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Accediendo al panel · ReservaYa",
  path: "/auth/callback",
  description: "Validando el enlace seguro de acceso al panel.",
});

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeAuthCallbackNextPath(params?.next);

  return (
    <main className="landing-theme flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md border border-rule bg-card px-6 py-8 sm:px-8">
        <Link href="/" className="inline-flex h-11 items-center" aria-label="Ir al inicio de ReservaYa">
          <ReservaYaLogo size="md" />
        </Link>
        <div className="mt-8 space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Accediendo al panel</h1>
          <p className="text-sm text-muted-foreground">
            Estamos validando el enlace seguro antes de abrir el panel del negocio.
          </p>
        </div>
        <div className="mt-6">
          <AuthCallbackClient next={next} />
        </div>
      </section>
    </main>
  );
}
