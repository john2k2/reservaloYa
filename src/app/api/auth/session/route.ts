import { NextResponse } from "next/server";

import { getLandingHeaderSession } from "@/server/landing-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getLandingHeaderSession();

  return NextResponse.json({
    ...session,
    subscriptionExpired: false,
  });
}
