import { NextResponse, type NextRequest } from "next/server";

import { signOutSupabaseUser } from "@/server/supabase-auth";

export async function POST(request: NextRequest) {
  await signOutSupabaseUser();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
  });
}
