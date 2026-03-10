"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isDemoModeEnabled } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import {
  createPocketBaseServerClient,
  persistPocketBaseAuth,
} from "@/lib/pocketbase/server";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";

const ADMIN_LOGIN_LIMIT_MAX = 5;
const ADMIN_LOGIN_LIMIT_WINDOW_MS = 60_000;

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const requestHeaders = await headers();
    const clientId = getRateLimitIdentifier(requestHeaders, "admin-login");

    await assertRateLimit({
      bucket: "admin-login",
      identifier: clientId,
      max: ADMIN_LOGIN_LIMIT_MAX,
      windowMs: ADMIN_LOGIN_LIMIT_WINDOW_MS,
      message: "Demasiados intentos de login.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(
        `/admin/login?error=${encodeURIComponent(
          `${error.message} Reintenta en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!isPocketBaseConfigured()) {
    if (isDemoModeEnabled()) {
      redirect("/admin/dashboard");
    }

    redirect("/admin/login?error=El acceso admin esta deshabilitado hasta conectar la autenticacion real.");
  }

  if (!email || !password) {
    redirect("/admin/login?error=Completa%20email%20y%20password");
  }

  const pb = await createPocketBaseServerClient();

  try {
    await pb.collection("users").authWithPassword(email, password);

    if ((pb.authStore.record as { active?: boolean } | null)?.active === false) {
      pb.authStore.clear();
      redirect("/admin/login?error=Tu usuario esta desactivado.");
    }

    await persistPocketBaseAuth(pb);
  } catch (error) {
    redirect(
      `/admin/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos iniciar sesion."
      )}`
    );
  }

  redirect("/admin/dashboard");
}
