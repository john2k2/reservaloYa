import { type NextRequest } from "next/server";

import { updatePocketBaseSession } from "@/lib/pocketbase/proxy";

export async function proxy(request: NextRequest) {
  return updatePocketBaseSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
