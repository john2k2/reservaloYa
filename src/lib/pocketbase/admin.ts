import type { RecordModel } from "pocketbase";
import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBaseAdminEmail,
  getPocketBaseAdminPassword,
  isPocketBaseAdminConfigured,
} from "@/lib/pocketbase/config";

// Auth cacheada en memoria para evitar re-autenticar en cada request.
// Vercel Fluid Compute reutiliza instancias, así que este cache evita que
// PocketBase mande "Login from a new location" por cada llamada al admin.
let cachedAdminToken: string | null = null;
let cachedAdminRecord: RecordModel | null = null;
let cachedAdminTokenExpiresAt = 0;

async function getAdminAuth(): Promise<{ token: string; record: RecordModel }> {
  const now = Date.now();

  // Renovar si falta menos de 5 minutos para expirar
  if (cachedAdminToken && cachedAdminRecord && cachedAdminTokenExpiresAt - now > 5 * 60 * 1000) {
    return { token: cachedAdminToken, record: cachedAdminRecord };
  }

  const client = createPocketBaseClient();
  const authData = await client.collection("_superusers").authWithPassword(
    getPocketBaseAdminEmail(),
    getPocketBaseAdminPassword()
  );

  cachedAdminToken = authData.token;
  cachedAdminRecord = authData.record as RecordModel;
  // Los tokens de PocketBase duran 14 días por defecto
  cachedAdminTokenExpiresAt = now + 12 * 60 * 60 * 1000; // refrescar cada 12h

  return { token: cachedAdminToken, record: cachedAdminRecord };
}

export async function createPocketBaseAdminClient() {
  const client = createPocketBaseClient();
  const { token, record } = await getAdminAuth();
  client.authStore.save(token, record);
  return client;
}

export function assertPocketBaseAdminConfigured() {
  if (!isPocketBaseAdminConfigured()) {
    throw new Error(
      "PocketBase admin credentials are required. Define POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD."
    );
  }
}
