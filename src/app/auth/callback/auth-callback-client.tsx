"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { completeSupabaseAuthCallbackAction } from "./actions";

type AuthCallbackStatus =
  | { kind: "loading" }
  | { kind: "error"; message: string };

export function AuthCallbackClient({ next }: { next: string }) {
  const [status, setStatus] = useState<AuthCallbackStatus>({ kind: "loading" });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const errorDescription =
      hashParams.get("error_description") ?? queryParams.get("error_description");
    const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");

    if (window.history.replaceState) {
      window.history.replaceState(null, "", `/auth/callback?next=${encodeURIComponent(next)}`);
    }

    if (errorDescription) {
      queueMicrotask(() => setStatus({ kind: "error", message: errorDescription }));
      return;
    }

    if (!accessToken) {
      queueMicrotask(() =>
        setStatus({
          kind: "error",
          message: "El enlace de acceso no incluye credenciales válidas. Volvé a iniciar sesión.",
        })
      );
      return;
    }

    startTransition(async () => {
      const result = await completeSupabaseAuthCallbackAction(accessToken, next);
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }

      window.location.replace(result.next);
    });
  }, [next]);

  if (status.kind === "error") {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
        <p>{status.message}</p>
        <Link href="/login" className="mt-4 inline-flex font-medium underline underline-offset-4">
          Volver al login
        </Link>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Validando acceso al panel...</p>;
}
