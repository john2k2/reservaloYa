import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBaseAdminEmail,
  getPocketBaseAdminPassword,
  isPocketBaseAdminConfigured,
} from "@/lib/pocketbase/config";

// Token cacheado en memoria para evitar re-autenticar en cada request.
// Vercel Fluid Compute reutiliza instancias, así que este cache evita que
// PocketBase mande "Login from a new location" por cada llamada al admin.
let cachedAdminToken: string | null = null;
let cachedAdminTokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  const now = Date.now();

  // Renovar si falta menos de 5 minutos para expirar
  if (cachedAdminToken && cachedAdminTokenExpiresAt - now > 5 * 60 * 1000) {
    return cachedAdminToken;
  }

  const client = createPocketBaseClient();
  const authData = await client.collection("_superusers").authWithPassword(
    getPocketBaseAdminEmail(),
    getPocketBaseAdminPassword()
  );

  cachedAdminToken = authData.token;
  // Los tokens de PocketBase duran 14 días por defecto
  cachedAdminTokenExpiresAt = now + 12 * 60 * 60 * 1000; // refrescar cada 12h

  return cachedAdminToken;
}

export async function createPocketBaseAdminClient() {
  const client = createPocketBaseClient();
  const token = await getAdminToken();
  client.authStore.save(token, null);
  return client;
}

export function assertPocketBaseAdminConfigured() {
  if (!isPocketBaseAdminConfigured()) {
    throw new Error(
      "PocketBase admin credentials are required. Define POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD."
    );
  }
}
