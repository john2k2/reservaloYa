import { cookies } from "next/headers";

const localBusinessCookieName = "reservaya-local-business";

export async function getLocalActiveBusinessSlug() {
  const cookieStore = await cookies();
  return cookieStore.get(localBusinessCookieName)?.value ?? null;
}

export async function setLocalActiveBusinessSlug(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(localBusinessCookieName, slug, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}
