import { cookies } from "next/headers";

import { getPocketBaseAuthCookieOptions } from "@/lib/pocketbase/config";
import {
  createPocketBaseClient,
  getCookieHeader,
  parsePocketBaseAuthCookie,
} from "@/lib/pocketbase/shared";

export async function createPocketBaseServerClient() {
  const client = createPocketBaseClient();
  const cookieStore = await cookies();
  const cookieHeader = getCookieHeader(cookieStore.getAll());

  if (cookieHeader) {
    client.authStore.loadFromCookie(cookieHeader);
  }

  return client;
}

export async function refreshPocketBaseAuth(pb: ReturnType<typeof createPocketBaseClient>) {
  if (!pb.authStore.isValid) {
    return false;
  }

  try {
    await pb.collection("users").authRefresh();
    return true;
  } catch {
    pb.authStore.clear();
    return false;
  }
}

export async function persistPocketBaseAuth(pb: ReturnType<typeof createPocketBaseClient>) {
  const cookieStore = await cookies();
  const serializedCookie = pb.authStore.exportToCookie(
    getPocketBaseAuthCookieOptions()
  );
  const parsedCookie = parsePocketBaseAuthCookie(serializedCookie);

  cookieStore.set(parsedCookie.name, parsedCookie.value, {
    ...getPocketBaseAuthCookieOptions(parsedCookie.options.expires),
    path: parsedCookie.options.path,
  });
}

export async function clearPocketBaseAuth() {
  const cookieStore = await cookies();
  cookieStore.delete("pb_auth");
}
