"use client";

import { useActionState, useEffect, useState } from "react";

import { resetPasswordAction } from "@/app/login/actions";
import { LoadingButton } from "@/components/ui/loading-button";

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [state, formAction] = useActionState(resetPasswordAction, null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (!accessToken || type !== "recovery") {
      setTokenError("Falta el token de recuperación. Abrí el enlace que recibiste por correo.");
      return;
    }

    setToken(accessToken);

    if (window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (tokenError) {
    return (
      <div className="mt-8 rounded-md border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
        {tokenError}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mt-8 text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const error = state?.error;

  return (
    <>
      {error && (
        <div
          className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <form action={formAction} className="mt-8 space-y-6">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className="minimalist-input"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="passwordConfirm" className="text-sm font-medium text-foreground">
            Repetí la contraseña
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repetí tu nueva contraseña"
            className="minimalist-input"
            required
          />
        </div>

        <LoadingButton
          pendingLabel="Actualizando contraseña..."
          className="h-12 w-full rounded-md bg-foreground font-medium text-background"
        >
          Guardar nueva contraseña
        </LoadingButton>
      </form>
    </>
  );
}
