import Link from "next/link";

import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { sanitizeAuthCallbackNextPath } from "@/server/auth-callback";
import { AuthCallbackClient } from "./auth-callback-client";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeAuthCallbackNextPath(params?.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <Link href="/" className="inline-flex h-11 items-center" aria-label="Ir al inicio de ReservaYa">
          <ReservaYaLogo size="md" />
        </Link>
        <div className="mt-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Accediendo al panel</h1>
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
