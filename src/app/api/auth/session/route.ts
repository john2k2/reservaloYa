import { NextResponse } from "next/server";

import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import type PocketBase from "pocketbase";

export const dynamic = "force-dynamic";

async function checkSubscriptionExpired(pb: PocketBase, businessId: string): Promise<boolean> {
  try {
    const filter = pb.filter("businessId = {:businessId}", { businessId });
    const subs = await pb.collection("subscriptions").getFullList({
      filter,
    });
    
    if (subs.length === 0) return false;
    
    const sub = subs[0];
    if (sub.status === "suspended") return true;
    if (sub.status === "trial" && sub.trialEndsAt) {
      return new Date(sub.trialEndsAt) < new Date();
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const pb = await createPocketBaseServerClient();
    const refreshed = await refreshPocketBaseAuth(pb);

    if (!refreshed || !pb.authStore.record) {
      return NextResponse.json({
        loggedIn: false,
        isPlatformAdmin: false,
        displayName: "",
        subscriptionExpired: false,
      });
    }

    const record = pb.authStore.record;
    const email = String(record.email ?? "").toLowerCase();
    const superadminEmail = (process.env.PLATFORM_SUPERADMIN_EMAIL ?? "").toLowerCase();

    const isPlatformAdmin = email === superadminEmail;

    if (isPlatformAdmin) {
      return NextResponse.json({
        loggedIn: true,
        isPlatformAdmin: true,
        displayName: "Admin",
        subscriptionExpired: false,
      });
    }

    const role = String((record as { role?: string }).role ?? "staff");
    const name = String(record.name ?? record.email ?? "Usuario");

    const businessId = Array.isArray(record.business)
      ? record.business[0]
      : record.business;

    if (role === "owner" && businessId) {
      const expired = await checkSubscriptionExpired(pb, businessId as string);
      
      if (expired) {
        return NextResponse.json({
          loggedIn: false,
          isPlatformAdmin: false,
          displayName: "",
          subscriptionExpired: true,
        });
      }

      try {
        const business = await pb.collection("businesses").getOne<{ name: string }>(businessId as string);
        return NextResponse.json({
          loggedIn: true,
          isPlatformAdmin: false,
          displayName: business.name,
          subscriptionExpired: false,
        });
      } catch {
        return NextResponse.json({
          loggedIn: true,
          isPlatformAdmin: false,
          displayName: name,
          subscriptionExpired: false,
        });
      }
    }

    return NextResponse.json({
      loggedIn: true,
      isPlatformAdmin: false,
      displayName: name,
      subscriptionExpired: false,
    });
  } catch {
    return NextResponse.json({
      loggedIn: false,
      isPlatformAdmin: false,
      displayName: "",
      subscriptionExpired: false,
    });
  }
}
