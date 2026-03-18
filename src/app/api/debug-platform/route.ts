import { NextResponse } from "next/server";

import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { isPocketBaseAdminConfigured, isPocketBaseConfigured } from "@/lib/pocketbase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    isPocketBaseConfigured: isPocketBaseConfigured(),
    isPocketBaseAdminConfigured: isPocketBaseAdminConfigured(),
    pbUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "NOT SET",
    adminEmail: process.env.POCKETBASE_ADMIN_EMAIL ?? "NOT SET",
    adminPasswordSet: Boolean(process.env.POCKETBASE_ADMIN_PASSWORD),
  };

  try {
    const pb = await createPocketBaseAdminClient();
    result.adminClientOk = true;

    const businesses = await pb.collection("businesses").getFullList({ requestKey: null });
    result.businessesCount = businesses.length;
    result.businessesSample = businesses.slice(0, 2).map((b) => ({ id: b.id, name: b.name }));
  } catch (err) {
    result.adminClientOk = false;
    result.error = err instanceof Error ? err.message : String(err);
    result.errorStack = err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined;
  }

  return NextResponse.json(result);
}
