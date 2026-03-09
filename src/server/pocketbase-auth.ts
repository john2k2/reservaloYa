import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";

export async function getAuthenticatedPocketBaseUser() {
  const pb = await createPocketBaseServerClient();
  const refreshed = await refreshPocketBaseAuth(pb);

  if (!refreshed || !pb.authStore.record) {
    return null;
  }

  if ((pb.authStore.record as { active?: boolean }).active === false) {
    pb.authStore.clear();
    return null;
  }

  return pb.authStore.record;
}
