import { NextResponse } from "next/server";

import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { resolveImpersonationToken } from "@/server/queries/platform";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const admin = await getAuthenticatedPlatformAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const magicLink = await resolveImpersonationToken(token);

  if (!magicLink) {
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 410 });
  }

  return NextResponse.redirect(magicLink, { status: 302 });
}
