import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBaseAdminEmail,
  getPocketBaseAdminPassword,
  isPocketBaseAdminConfigured,
} from "@/lib/pocketbase/config";

let pocketBaseAdminClient: ReturnType<typeof createPocketBaseClient> | null = null;
let pocketBaseAdminClientPromise: Promise<ReturnType<typeof createPocketBaseClient>> | null = null;

async function authenticateAdminClient(client: ReturnType<typeof createPocketBaseClient>) {
  await client.collection("_superusers").authWithPassword(
    getPocketBaseAdminEmail(),
    getPocketBaseAdminPassword()
  );

  return client;
}

export async function createPocketBaseAdminClient() {
  if (pocketBaseAdminClient?.authStore.isValid) {
    return pocketBaseAdminClient;
  }

  if (!pocketBaseAdminClientPromise) {
    pocketBaseAdminClientPromise = (async () => {
      const client = pocketBaseAdminClient ?? createPocketBaseClient();

      await authenticateAdminClient(client);

      pocketBaseAdminClient = client;

      return client;
    })()
      .catch((error) => {
        pocketBaseAdminClient = null;
        throw error;
      })
      .finally(() => {
        pocketBaseAdminClientPromise = null;
      });
  }

  return pocketBaseAdminClientPromise;
}

export function assertPocketBaseAdminConfigured() {
  if (!isPocketBaseAdminConfigured()) {
    throw new Error(
      "PocketBase admin credentials are required. Define POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD."
    );
  }
}
