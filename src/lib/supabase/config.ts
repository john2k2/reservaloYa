import { isProductionEnvironment } from "@/lib/runtime";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || getRequiredEnv("SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );
}

export function getSupabaseAuthCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionEnvironment(),
    path: "/",
    expires,
  };
}
