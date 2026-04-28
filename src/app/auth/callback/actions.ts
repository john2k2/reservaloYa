"use server";

import {
  persistValidatedSupabaseAccessToken,
  sanitizeAuthCallbackNextPath,
} from "@/server/auth-callback";

type AuthCallbackResult =
  | { ok: true; next: string }
  | { ok: false; error: string };

export async function completeSupabaseAuthCallbackAction(
  accessToken: string,
  next?: string | null
): Promise<AuthCallbackResult> {
  try {
    await persistValidatedSupabaseAccessToken(accessToken);
    return { ok: true, next: sanitizeAuthCallbackNextPath(next) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos completar el acceso.",
    };
  }
}
