import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseAuthCookieOptions,
} from "@/lib/supabase/config";

const COOKIE_NAME = "sb_session";

export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createPublicClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSessionClient(accessToken?: string | null) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function createServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return createSessionClient(token);
}

export async function persistSupabaseAuth(accessToken: string, expiresAt?: Date) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, accessToken, {
    ...getSupabaseAuthCookieOptions(expiresAt),
  });
}

export async function clearSupabaseAuth() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getSupabaseAuthTokenFromCookies() {
  return cookies().then((cs) => cs.get(COOKIE_NAME)?.value ?? null);
}
