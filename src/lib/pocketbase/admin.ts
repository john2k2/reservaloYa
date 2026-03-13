import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBaseAdminEmail,
  getPocketBaseAdminPassword,
  isPocketBaseAdminConfigured,
} from "@/lib/pocketbase/config";

async function authenticateAdminClient(client: ReturnType<typeof createPocketBaseClient>) {
  await client.collection("_superusers").authWithPassword(
    getPocketBaseAdminEmail(),
    getPocketBaseAdminPassword()
  );

  return client;
}

export async function createPocketBaseAdminClient() {
  const client = createPocketBaseClient();
  await authenticateAdminClient(client);
  return client;
}

export function assertPocketBaseAdminConfigured() {
  if (!isPocketBaseAdminConfigured()) {
    throw new Error(
      "PocketBase admin credentials are required. Define POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD."
    );
  }
}
