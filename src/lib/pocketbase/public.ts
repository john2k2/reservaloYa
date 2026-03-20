import { createPocketBaseClient } from "@/lib/pocketbase/shared";
import {
  getPocketBasePublicAuthEmail,
  getPocketBasePublicAuthPassword,
  hasPocketBasePublicAuthCredentials,
} from "@/lib/pocketbase/config";

export async function createPocketBasePublicClient() {
  if (!hasPocketBasePublicAuthCredentials()) {
    throw new Error(
      "PocketBase public credentials are required. Define POCKETBASE_PUBLIC_AUTH_EMAIL and POCKETBASE_PUBLIC_AUTH_PASSWORD."
    );
  }

  const client = createPocketBaseClient();

  await client
    .collection("users")
    .authWithPassword(getPocketBasePublicAuthEmail(), getPocketBasePublicAuthPassword());

  return client;
}
