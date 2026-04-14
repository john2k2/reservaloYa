import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { createPocketBasePublicClient } from "@/lib/pocketbase/public";

export type PocketBaseListOptions = {
  sort?: string;
  expand?: string;
  filter?: string;
};

export type PocketBaseScopedClient =
  | Awaited<ReturnType<typeof createPocketBaseAdminClient>>
  | Awaited<ReturnType<typeof createPocketBasePublicClient>>;

export async function getAdminClient() {
  return createPocketBaseAdminClient();
}

export async function getPublicReadClient() {
  return createPocketBasePublicClient();
}

export async function getPublicMutationClient() {
  return createPocketBasePublicClient();
}

export function listPocketBaseRecordsWithClient<T>(
  pb: PocketBaseScopedClient,
  collection: string,
  options?: PocketBaseListOptions
) {
  return pb.collection(collection).getFullList<T>({
    sort: options?.sort,
    expand: options?.expand,
    filter: options?.filter,
    batch: 1000,
    requestKey: null,
  });
}

export async function listPocketBaseRecords<T>(
  collection: string,
  options?: PocketBaseListOptions
) {
  const pb = await getAdminClient();
  return listPocketBaseRecordsWithClient<T>(pb, collection, options);
}
