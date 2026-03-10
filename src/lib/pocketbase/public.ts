import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBasePublicAuthEmail,
  getPocketBasePublicAuthPassword,
  hasPocketBasePublicAuthCredentials,
} from "@/lib/pocketbase/config";

let pocketBasePublicClient: ReturnType<typeof createPocketBaseClient> | null = null;
let pocketBasePublicClientPromise: Promise<ReturnType<typeof createPocketBaseClient>> | null = null;

async function authenticatePublicClient(client: ReturnType<typeof createPocketBaseClient>) {
  if (!hasPocketBasePublicAuthCredentials()) {
    return client;
  }

  await client
    .collection("users")
    .authWithPassword(getPocketBasePublicAuthEmail(), getPocketBasePublicAuthPassword());

  return client;
}

export async function createPocketBasePublicClient() {
  if (!hasPocketBasePublicAuthCredentials()) {
    // Until least-privilege public credentials and collection rules are in place,
    // we resolve public server-side requests through the admin client.
    return createPocketBaseAdminClient();
  }

  if (pocketBasePublicClient?.authStore.isValid) {
    return pocketBasePublicClient;
  }

  if (!pocketBasePublicClientPromise) {
    pocketBasePublicClientPromise = (async () => {
      const client = pocketBasePublicClient ?? createPocketBaseClient();

      await authenticatePublicClient(client);

      pocketBasePublicClient = client;

      return client;
    })()
      .catch((error) => {
        pocketBasePublicClient = null;
        throw error;
      })
      .finally(() => {
        pocketBasePublicClientPromise = null;
      });
  }

  return pocketBasePublicClientPromise;
}
