"use server";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { signInSupabaseUser, createSupabaseOwnerAccount, resetSupabaseUserPassword, updateSupabaseUserPassword } from "@/server/supabase-auth";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import { env } from "@/lib/env";

function isSuperAdminEmail(email: string) {
  const superadminEmail = env.PLATFORM_SUPERADMIN_EMAIL;
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

function mapAuthErrorToSpanish(raw: string, fallback: string) {
  const normalized = raw.toLowerCase();
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("invalid_credentials")
  ) {
    return "Email o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) {
    return "Confirmá tu email antes de ingresar.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "Ese email ya tiene una cuenta.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }
  // Mensajes propios en español (con o sin tilde) se dejan pasar
  if (raw && !/\b(invalid|credentials|registered|confirm|password|user already)\b/i.test(raw)) {
    return raw;
  }
  return fallback;
}

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
          `${error.message} Reintentá en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!email || !password || password.length > 256 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/login?error=Completá%20email%20y%20contraseña.");
  }

  try {
    await signInSupabaseUser(email, password);
  } catch (error) {
    unstable_rethrow(error);

    const raw = error instanceof Error ? error.message : "";
    const message = mapAuthErrorToSpanish(
      raw,
      "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo."
    );

    redirect(`/login?error=${encodeURIComponent(message)}`);
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

  if (
    !ownerName || !businessName || !templateSlug || !phone || !address || !email || !password ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    redirect("/admin/signup?error=Completá todos los campos obligatorios.");
  }

  if (password.length > 256) {
    redirect("/admin/signup?error=La contraseña es demasiado larga.");
  }

  if (password.length < 8) {
    redirect("/admin/signup?error=La contraseña debe tener al menos 8 caracteres.");
  }

  try {
    await createSupabaseOwnerAccount({
      ownerName,
      email,
      password,
      businessName,
      businessSlug,
      phone,
      address,
      templateSlug,
    });

    await signInSupabaseUser(email, password);

    redirect(
      `/admin/onboarding?created=${encodeURIComponent(businessSlug)}&verification=${encodeURIComponent(
        "Cuenta creada correctamente."
      )}`
    );
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/signup?error=${encodeURIComponent(
        error instanceof Error
          ? mapAuthErrorToSpanish(error.message, "No pudimos crear tu cuenta.")
          : "No pudimos crear tu cuenta."
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
      message: "Demasiados intentos para recuperar la contraseña.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(
        `/admin/forgot-password?error=${encodeURIComponent(
          `${error.message} Reintentá en ${error.retryAfterSeconds}s.`
        )}`
      );
    }

    throw error;
  }

  if (!email) {
    redirect("/admin/forgot-password?error=Ingresá tu correo electrónico.");
  }

  try {
    await resetSupabaseUserPassword(email);
  } catch (error) {
    unstable_rethrow(error);
    redirect(
      `/admin/forgot-password?error=${encodeURIComponent(
        error instanceof Error
          ? mapAuthErrorToSpanish(error.message, "No pudimos procesar la solicitud.")
          : "No pudimos procesar la solicitud."
      )}`
    );
  }

  redirect(
    `/admin/forgot-password?success=${encodeURIComponent(
      "Si el correo existe, enviamos instrucciones para restablecer la contraseña."
    )}`
  );
}

export async function resetPasswordAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
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
      message: "Demasiados intentos para definir una nueva contraseña.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: `${error.message} Reintentá en ${error.retryAfterSeconds}s.` };
    }
    throw error;
  }

  if (!token) {
    return { error: "Token inválido. Solicitá un nuevo enlace de recuperación." };
  }

  if (!password || !passwordConfirm) {
    return { error: "Completá ambos campos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    await updateSupabaseUserPassword(token, password);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No pudimos actualizar la contraseña.",
    };
  }

  redirect(
    `/login?success=${encodeURIComponent(
      "Contraseña actualizada. Ya podés iniciar sesión con tu nueva clave."
    )}`
  );
}

export async function resendVerificationAction() {
  redirect("/admin/dashboard");
}

// token is passed by the caller but not used in Supabase mode (auth handles it via magic link)
export async function confirmEmailVerificationAction(_token: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
  redirect("/login");
}
