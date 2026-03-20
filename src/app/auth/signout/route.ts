import { NextResponse, type NextRequest } from "next/server";

import { clearPocketBaseAuth, createPocketBaseServerClient } from "@/lib/pocketbase/server";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";

export async function POST(request: NextRequest) {
  if (isPocketBaseConfigured()) {
    const pb = await createPocketBaseServerClient();
    pb.authStore.clear();
    await clearPocketBaseAuth();
  }

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
  });
}
