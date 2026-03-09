import { type NextRequest } from "next/server";

import { updatePocketBaseSession } from "@/lib/pocketbase/proxy";

export async function proxy(request: NextRequest) {
  return updatePocketBaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
