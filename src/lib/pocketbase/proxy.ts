import { NextResponse, type NextRequest } from "next/server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import {
  createPocketBaseClient,
  parsePocketBaseAuthCookie,
} from "@/lib/pocketbase/shared";

export async function updatePocketBaseSession(request: NextRequest) {
  if (!isPocketBaseConfigured()) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });
  const pb = createPocketBaseClient();
  pb.authStore.loadFromCookie(request.headers.get("cookie") ?? "");

  if (!pb.authStore.isValid) {
    return response;
  }

  try {
    await pb.collection("users").authRefresh();
    const parsedCookie = parsePocketBaseAuthCookie(pb.authStore.exportToCookie());

    response.cookies.set(parsedCookie.name, parsedCookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: parsedCookie.options.secure,
      path: parsedCookie.options.path,
      expires: parsedCookie.options.expires,
    });
  } catch {
    response.cookies.delete("pb_auth");
  }

  return response;
}
