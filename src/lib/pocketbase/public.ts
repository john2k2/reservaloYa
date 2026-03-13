import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBasePublicAuthEmail,
  getPocketBasePublicAuthPassword,
  hasPocketBasePublicAuthCredentials,
} from "@/lib/pocketbase/config";

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

  try {
    const client = createPocketBaseClient();
    await authenticatePublicClient(client);
    return client;
  } catch {
    return createPocketBaseAdminClient();
  }
}
