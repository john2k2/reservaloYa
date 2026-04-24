import { unstable_noStore as noStore } from "next/cache";

import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import {
  getSupabaseAdminShellData,
  getSupabaseAdminBookingsData,
  getSupabaseAdminCustomersData,
  getSupabaseAdminServicesData,
  getSupabaseAdminAvailabilityData,
  getSupabaseAdminSettingsData,
  getSupabaseAdminDashboardData,
  getSupabaseOnboardingData,
  getSupabaseAdminTeamData,
  getSupabaseSubscriptionData,
} from "@/server/supabase-store";

type AdminShellData = {
  demoMode: boolean;
  profileName: string;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  userVerified?: boolean;
  userRole?: string;
  businessId?: string;
  businessOptions?: Array<{
    slug: string;
    name: string;
    templateSlug: string;
  }>;
  subscriptionStatus?: "trial" | "active" | "cancelled" | "suspended";
  subscriptionExpired?: boolean;
};

export async function getAdminShellData(): Promise<AdminShellData | null> {
  noStore();

  const user = await getAuthenticatedSupabaseUser();

  if (!user) {
    return null;
  }

  return getSupabaseAdminShellData(user);
}

async function getLiveBusinessId() {
  const shellData = await getAdminShellData();

  return getLiveBusinessIdFromShell(shellData);
}

function getLiveBusinessIdFromShell(shellData: AdminShellData | null) {
  if (!shellData || shellData.demoMode || !shellData.businessId) {
    return null;
  }

  return {
    ...shellData,
    businessId: shellData.businessId,
  };
}

export async function getAdminDashboardData(shellData?: AdminShellData | null) {
  noStore();

  const liveBusiness =
    shellData === undefined
      ? await getLiveBusinessId()
      : getLiveBusinessIdFromShell(shellData);

  if (!liveBusiness) {
    return null;
  }

  return getSupabaseAdminDashboardData(liveBusiness.businessId);
}

export async function getAdminTeamData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return [];
  }

  return getSupabaseAdminTeamData(shellData.businessId);
}

export async function getAdminServicesData(shellData?: AdminShellData | null) {
  noStore();

  const liveBusiness =
    shellData === undefined
      ? await getLiveBusinessId()
      : getLiveBusinessIdFromShell(shellData);

  if (!liveBusiness) {
    return null;
  }

  return getSupabaseAdminServicesData(liveBusiness.businessId);
}

export type AdminBookingsFilters = {
  status?: string;
  date?: string;
  q?: string;
};

function normalizeBookingFilters(filters?: AdminBookingsFilters) {
  return {
    status: filters?.status?.trim() || "",
    date: filters?.date?.trim() || "",
    q: filters?.q?.trim() || "",
  };
}

export async function getAdminBookingsData(filters?: AdminBookingsFilters) {
  noStore();
  const normalizedFilters = normalizeBookingFilters(filters);

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return null;
  }

  return getSupabaseAdminBookingsData(shellData.businessId, normalizedFilters);
}

export async function getAdminCustomersData() {
  noStore();
  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return null;
  }

  return getSupabaseAdminCustomersData(shellData.businessId);
}

export async function getAdminCustomersDataWithFilter(query?: string) {
  noStore();
  const normalizedQuery = query?.trim() ?? "";

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return null;
  }

  return getSupabaseAdminCustomersData(shellData.businessId, normalizedQuery);
}

export async function getAdminAvailabilityData(shellData?: AdminShellData | null) {
  noStore();

  const liveBusiness =
    shellData === undefined
      ? await getLiveBusinessId()
      : getLiveBusinessIdFromShell(shellData);

  if (!liveBusiness) {
    return null;
  }

  return getSupabaseAdminAvailabilityData(liveBusiness.businessId);
}

export async function getAdminSettingsData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return null;
  }

  return getSupabaseAdminSettingsData(shellData.businessId);
}

export async function getAdminBillingData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return null;
  }

  const subscription = await getSupabaseSubscriptionData(shellData.businessId);

  return {
    businessId: shellData.businessId,
    subscription,
  };
}

export async function getAdminOnboardingData() {
  noStore();

  const shellData = await getAdminShellData();

  const onboardingData = await getSupabaseOnboardingData(shellData?.businessId);

  return {
    demoMode: false,
    businesses: onboardingData.businesses,
    templates: onboardingData.templates,
    activeBusinessSlug: shellData?.businessSlug ?? null,
  };
}
