import { unstable_noStore as noStore } from "next/cache";

import { isDemoModeEnabled } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  getLocalAdminAvailabilityData,
  getLocalAdminBookingsData,
  getLocalAdminCustomersData,
  getLocalAdminDashboardData,
  getLocalOnboardingData,
  getLocalAdminServicesData,
  getLocalAdminSettingsData,
  getLocalAdminShellData,
} from "@/server/local-store";
import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";
import {
  getPocketBaseAdminAvailabilityData,
  getPocketBaseAdminBookingsData,
  getPocketBaseAdminCustomersData,
  getPocketBaseAdminDashboardData,
  getPocketBaseAdminServicesData,
  getPocketBaseAdminSettingsData,
  getPocketBaseAdminShellData,
  getPocketBaseAdminTeamData,
  getPocketBaseOnboardingData,
} from "@/server/pocketbase-store";

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

function canUseLocalAdminMode() {
  return process.env.NODE_ENV !== "production" && isDemoModeEnabled();
}

export async function getAdminShellData(): Promise<AdminShellData | null> {
  noStore();

  if (!isPocketBaseConfigured()) {
    if (!canUseLocalAdminMode()) {
      return null;
    }

    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminShellData(activeBusinessSlug);
  }

  const user = await getAuthenticatedPocketBaseUser();

  if (!user) {
    return null;
  }

  return getPocketBaseAdminShellData(user);
}

async function getLiveBusinessId() {
  const shellData = await getAdminShellData();

  if (!shellData || shellData.demoMode || !shellData.businessId) {
    return null;
  }

  return {
    ...shellData,
    businessId: shellData.businessId,
  };
}

export async function getAdminDashboardData() {
  noStore();

  const shellData = await getAdminShellData();

  if (!shellData || shellData.demoMode || !shellData.businessId) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminDashboardData(activeBusinessSlug);
  }

  return getPocketBaseAdminDashboardData(shellData.businessId);
}

export async function getAdminTeamData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    return [];
  }

  return getPocketBaseAdminTeamData(shellData.businessId);
}

export async function getAdminServicesData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminServicesData(activeBusinessSlug);
  }

  return getPocketBaseAdminServicesData(shellData.businessId);
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
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminBookingsData(activeBusinessSlug, normalizedFilters);
  }

  return getPocketBaseAdminBookingsData(shellData.businessId, normalizedFilters);
}

export async function getAdminCustomersData() {
  noStore();
  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminCustomersData(activeBusinessSlug);
  }

  return getPocketBaseAdminCustomersData(shellData.businessId);
}

export async function getAdminCustomersDataWithFilter(query?: string) {
  noStore();
  const normalizedQuery = query?.trim() ?? "";

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminCustomersData(activeBusinessSlug, normalizedQuery);
  }

  return getPocketBaseAdminCustomersData(shellData.businessId, normalizedQuery);
}

export async function getAdminAvailabilityData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminAvailabilityData(activeBusinessSlug);
  }

  return getPocketBaseAdminAvailabilityData(shellData.businessId);
}

export async function getAdminSettingsData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminSettingsData(activeBusinessSlug);
  }

  return getPocketBaseAdminSettingsData(shellData.businessId);
}

export async function getAdminOnboardingData() {
  noStore();

  const shellData = await getAdminShellData();

  if (!isPocketBaseConfigured()) {
    if (!isDemoModeEnabled()) {
      return {
        demoMode: false,
        businesses: [],
        templates: [],
        activeBusinessSlug: shellData?.businessSlug ?? null,
      };
    }

    const localOnboardingData = await getLocalOnboardingData();

    return {
      demoMode: true,
      businesses: localOnboardingData.businesses,
      templates: localOnboardingData.templates,
      activeBusinessSlug: shellData?.businessSlug ?? null,
    };
  }

  const onboardingData = await getPocketBaseOnboardingData(shellData?.businessId);

  return {
    demoMode: false,
    businesses: onboardingData.businesses,
    templates: onboardingData.templates,
    activeBusinessSlug: shellData?.businessSlug ?? null,
  };
}
