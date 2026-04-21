import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/config";

export function createBrowserClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
