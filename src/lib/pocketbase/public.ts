import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBasePublicAuthEmail,
  getPocketBasePublicAuthPassword,
  hasPocketBasePublicAuthCredentials,
} from "@/lib/pocketbase/config";
import { isProductionEnvironment } from "@/lib/runtime";

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
    if (!isProductionEnvironment()) {
      return createPocketBaseAdminClient();
    }

    throw new Error(
      "PocketBase public credentials are required in production. Define POCKETBASE_PUBLIC_AUTH_EMAIL and POCKETBASE_PUBLIC_AUTH_PASSWORD."
    );
  }

  try {
    const client = createPocketBaseClient();
    await authenticatePublicClient(client);
    return client;
  } catch {
    if (!isProductionEnvironment()) {
      return createPocketBaseAdminClient();
    }

    throw new Error(
      "PocketBase public credentials are configured but the public client could not authenticate."
    );
  }
}

export function canFallbackToAdminForPublicRequests() {
  return !isProductionEnvironment();
}
