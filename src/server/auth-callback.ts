import { createPublicClient, persistSupabaseAuth } from "@/lib/supabase/server";

const DEFAULT_AUTH_CALLBACK_NEXT = "/admin/dashboard";

export function sanitizeAuthCallbackNextPath(next?: string | null) {
  if (!next) return DEFAULT_AUTH_CALLBACK_NEXT;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AUTH_CALLBACK_NEXT;
  }

  try {
    const parsed = new URL(trimmed, "http://reservaya.local");
    if (parsed.origin !== "http://reservaya.local") {
      return DEFAULT_AUTH_CALLBACK_NEXT;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTH_CALLBACK_NEXT;
  }
}

function getJwtExpiresAt(accessToken: string) {
  const [, payload] = accessToken.split(".");
  if (!payload) return undefined;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as { exp?: unknown };
    return typeof parsed.exp === "number" ? new Date(parsed.exp * 1000) : undefined;
  } catch {
    return undefined;
  }
}

export async function persistValidatedSupabaseAccessToken(accessToken: string) {
  const token = accessToken.trim();
  if (!token) {
    throw new Error("El enlace de acceso no incluye un token válido.");
  }

  const client = createPublicClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    throw new Error("El enlace de acceso es inválido o expiró. Solicitá uno nuevo.");
  }

  await persistSupabaseAuth(token, getJwtExpiresAt(token));
}
