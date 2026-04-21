import { unstable_cache, unstable_noStore as noStore } from "next/cache";

import {
  getSupabasePublicBookingFlowData,
  getSupabasePublicBusinessPageData,
  getSupabaseBookingConfirmationData,
  getSupabaseManageBookingData,
} from "@/server/supabase-store";

const getCachedSupabasePublicBusinessPageData = unstable_cache(
  async (slug: string) => getSupabasePublicBusinessPageData(slug),
  ["public-business-supabase"],
  {
    revalidate: 60,
    tags: ["public-business"],
  }
);

export async function getPublicBusinessPageData(slug: string) {
  return getCachedSupabasePublicBusinessPageData(slug);
}

export async function getPublicBookingFlowData({
  slug,
  serviceId,
  bookingDate,
}: {
  slug: string;
  serviceId?: string;
  bookingDate?: string;
}) {
  noStore();

  const pageData = await getPublicBusinessPageData(slug);

  if (!pageData) {
    return null;
  }

  const selectedService =
    pageData.services.find((service) => service.id === serviceId) ??
    pageData.services[0];
  const fallbackBaseDate = new Date().toISOString().slice(0, 10);

  if (!selectedService) {
    return {
      ...pageData,
      selectedService: null,
      bookingDate: bookingDate ?? fallbackBaseDate,
      dateOptions: [bookingDate ?? fallbackBaseDate],
      slots: [],
    };
  }

  return getSupabasePublicBookingFlowData(
    { slug, serviceId, bookingDate },
    pageData
  );
}

export async function getBookingConfirmationData({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId?: string;
  token?: string;
  skipTokenValidation?: boolean;
}) {
  noStore();

  if (!bookingId) {
    return null;
  }

  return getSupabaseBookingConfirmationData({ slug, bookingId });
}

export async function getPublicManageBookingData({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId?: string;
  token?: string;
}) {
  noStore();

  if (!bookingId) {
    return null;
  }

  return getSupabaseManageBookingData({ slug, bookingId });
}
