"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isDemoModeEnabled } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import {
  createPocketBaseServerClient,
  persistPocketBaseAuth,
} from "@/lib/pocketbase/server";
import { createPocketBaseOwnerAccount } from "@/server/pocketbase-store";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";

function isSuperAdminEmail(email: string) {
  const superadminEmail = process.env.PLATFORM_SUPERADMIN_EMAIL;
  if (!superadminEmail) return false;
  return email.toLowerCase().trim() === superadminEmail.toLowerCase().trim();
}

const ADMIN_LOGIN_LIMIT_MAX = 5;
const ADMIN_LOGIN_LIMIT_WINDOW_MS = 60_000;
const ADMIN_SIGNUP_LIMIT_MAX = 3;
const ADMIN_SIGNUP_LIMIT_WINDOW_MS = 60_000;
const PASSWORD_RESET_REQUEST_LIMIT_MAX = 3;
const PASSWORD_RESET_REQUEST_LIMIT_WINDOW_MS = 60_000;
const PASSWORD_RESET_CONFIRM_LIMIT_MAX = 5;
const PASSWORD_RESET_CONFIRM_LIMIT_WINDOW_MS = 60_000;

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
        `/login?error=${encodeURIComponent(
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

    redirect("/login?error=El acceso admin esta deshabilitado hasta conectar la autenticacion real.");
  }

  if (!email || !password || password.length > 256 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/login?error=Completa%20email%20y%20password");
  }

  const pb = await createPocketBaseServerClient();

  try {
    await pb.collection("users").authWithPassword(email, password);

    if ((pb.authStore.record as { active?: boolean } | null)?.active === false) {
      pb.authStore.clear();
      redirect("/login?error=Tu usuario esta desactivado.");
    }

    await persistPocketBaseAuth(pb);
  } catch (error) {
    // Re-throw Next.js redirect/notFound — must not be caught
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;

    redirect(
      `/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos iniciar sesion."
      )}`
    );
  }

  if (isSuperAdminEmail(email)) {
    redirect("/platform/dashboard");
  }

  redirect("/admin/dashboard");
}

export async function signupAction(formData: FormData) {
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessSlug = String(formData.get("businessSlug") ?? "").trim();
  const templateSlug = String(formData.get("templateSlug") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    const requestHeaders = await headers();
    const clientId = getRateLimitIdentifier(requestHeaders, "admin-signup");

    await assertRateLimit({
      bucket: "admin-signup",
      identifier: clientId,
      max: ADMIN_SIGNUP_LIMIT_MAX,
      windowMs: ADMIN_SIGNUP_LIMIT_WINDOW_MS,
      message: "Demasiados intentos de registro.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(
        `/admin/signup?error=${encodeURIComponent(
          `${error.message} Reintenta en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!isPocketBaseConfigured()) {
    redirect("/admin/signup?error=El registro self-serve requiere PocketBase configurado.");
  }

  if (
    !ownerName || !businessName || !templateSlug || !phone || !address || !email || !password ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    redirect("/admin/signup?error=Completa todos los campos obligatorios.");
  }

  if (password.length > 256) {
    redirect("/admin/signup?error=La contrasena es demasiado larga.");
  }

  if (password.length < 8) {
    redirect("/admin/signup?error=La contrasena debe tener al menos 8 caracteres.");
  }

  try {
    const created = await createPocketBaseOwnerAccount({
      ownerName,
      email,
      password,
      businessName,
      businessSlug,
      phone,
      address,
      templateSlug,
    });

    const pb = await createPocketBaseServerClient();

    try {
      await pb.collection("users").requestVerification(created.email);
    } catch {
      // Best-effort. The account is already created and usable.
    }

    await pb.collection("users").authWithPassword(created.email, password);
    await persistPocketBaseAuth(pb);

    redirect(
      `/admin/onboarding?created=${encodeURIComponent(created.businessSlug)}&verification=${encodeURIComponent(
        "Te enviamos un correo para verificar tu email."
      )}`
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;

    redirect(
      `/admin/signup?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos crear tu cuenta."
      )}`
    );
  }
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  try {
    const requestHeaders = await headers();
    const clientId = getRateLimitIdentifier(requestHeaders, "password-reset-request");

    await assertRateLimit({
      bucket: "password-reset-request",
      identifier: `${clientId}:${email || "anonymous"}`,
      max: PASSWORD_RESET_REQUEST_LIMIT_MAX,
      windowMs: PASSWORD_RESET_REQUEST_LIMIT_WINDOW_MS,
      message: "Demasiados intentos para recuperar la contrasena.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(
        `/admin/forgot-password?error=${encodeURIComponent(
          `${error.message} Reintenta en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!isPocketBaseConfigured()) {
    redirect("/admin/forgot-password?error=La recuperacion de contrasena requiere PocketBase configurado.");
  }

  if (!email) {
    redirect("/admin/forgot-password?error=Ingresa tu correo electrónico.");
  }

  const pb = await createPocketBaseServerClient();

  try {
    await pb.collection("users").requestPasswordReset(email);
  } catch (error) {
    redirect(
      `/admin/forgot-password?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos procesar la solicitud."
      )}`
    );
  }

  redirect(
    `/admin/forgot-password?success=${encodeURIComponent(
      "Si el correo existe, enviamos instrucciones para restablecer la contraseña."
    )}`
  );
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  try {
    const requestHeaders = await headers();
    const clientId = getRateLimitIdentifier(requestHeaders, "password-reset-confirm");

    await assertRateLimit({
      bucket: "password-reset-confirm",
      identifier: `${clientId}:${token || "missing-token"}`,
      max: PASSWORD_RESET_CONFIRM_LIMIT_MAX,
      windowMs: PASSWORD_RESET_CONFIRM_LIMIT_WINDOW_MS,
      message: "Demasiados intentos para definir una nueva contrasena.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(
        `/admin/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(
          `${error.message} Reintenta en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!isPocketBaseConfigured()) {
    redirect("/admin/reset-password?error=La recuperacion de contrasena requiere PocketBase configurado.");
  }

  if (!token) {
    redirect("/admin/reset-password?error=Falta el token de recuperacion.");
  }

  if (!password || !passwordConfirm) {
    redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&error=Completa ambos campos.`);
  }

  if (password.length < 8) {
    redirect(
      `/admin/reset-password?token=${encodeURIComponent(token)}&error=La contrasena debe tener al menos 8 caracteres.`
    );
  }

  if (password !== passwordConfirm) {
    redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&error=Las contrasenas no coinciden.`);
  }

  const pb = await createPocketBaseServerClient();

  try {
    await pb.collection("users").confirmPasswordReset(token, password, passwordConfirm);
  } catch (error) {
    redirect(
      `/admin/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos actualizar la contrasena."
      )}`
    );
  }

  redirect(
    `/login?success=${encodeURIComponent(
      "Contrasena actualizada. Ya puedes iniciar sesion con tu nueva clave."
    )}`
  );
}

export async function resendVerificationAction() {
  if (!isPocketBaseConfigured()) {
    redirect("/admin/dashboard?error=La verificacion requiere PocketBase configurado.");
  }

  const pb = await createPocketBaseServerClient();
  const refreshed = await pb.collection("users").authRefresh().catch(() => null);
  const email = refreshed?.record?.email ? String(refreshed.record.email).trim().toLowerCase() : "";

  if (!email) {
    redirect("/login?error=Necesitas iniciar sesion para reenviar la verificacion.");
  }

  try {
    await pb.collection("users").requestVerification(email);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;

    redirect(
      `/admin/dashboard?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos reenviar la verificacion."
      )}`
    );
  }

  redirect(
    `/admin/dashboard?success=${encodeURIComponent(
      "Te reenviamos el correo de verificación."
    )}`
  );
}

export async function confirmEmailVerificationAction(token: string) {
  if (!isPocketBaseConfigured()) {
    redirect("/login?error=La verificacion requiere PocketBase configurado.");
  }

  if (!token) {
    redirect("/login?error=Falta el token de verificacion.");
  }

  const pb = await createPocketBaseServerClient();

  try {
    await pb.collection("users").confirmVerification(token);
  } catch (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos verificar tu email."
      )}`
    );
  }

  redirect(
    `/login?success=${encodeURIComponent(
      "Email verificado correctamente. Ya puedes seguir usando tu cuenta."
    )}`
  );
}
