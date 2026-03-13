import { unstable_cache, unstable_noStore as noStore } from "next/cache";

import { demoSlots } from "@/constants/demo";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import {
  getLocalBookingConfirmationData,
  getLocalPublicBookingFlowData,
  getLocalPublicBusinessPageData,
  getLocalPublicManageBookingData,
} from "@/server/local-store";
import {
  getPocketBaseBookingConfirmationData,
  getPocketBaseManageBookingData,
  getPocketBasePublicBookingFlowData,
  getPocketBasePublicBusinessPageData,
} from "@/server/pocketbase-store";

const getCachedLocalPublicBusinessPageData = unstable_cache(
  async (slug: string) => getLocalPublicBusinessPageData(slug),
  ["public-business-local"],
  {
    revalidate: 60,
    tags: ["public-business"],
  }
);

const getCachedPocketBasePublicBusinessPageData = unstable_cache(
  async (slug: string) => getPocketBasePublicBusinessPageData(slug),
  ["public-business-pocketbase"],
  {
    revalidate: 60,
    tags: ["public-business"],
  }
);

export async function getPublicBusinessPageData(slug: string) {
  if (!isPocketBaseConfigured()) {
    return getCachedLocalPublicBusinessPageData(slug);
  }

  return getCachedPocketBasePublicBusinessPageData(slug);
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
      slots: demoSlots,
    };
  }

  if (!isPocketBaseConfigured() || pageData.source === "local") {
    return getLocalPublicBookingFlowData({
      slug,
      serviceId,
      bookingDate,
    });
  }
  return getPocketBasePublicBookingFlowData(
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
}) {
  noStore();

  if (!bookingId || !isPocketBaseConfigured()) {
    return getLocalBookingConfirmationData(bookingId);
  }
  return (
    (await getPocketBaseBookingConfirmationData({ slug, bookingId })) ??
    getLocalBookingConfirmationData(bookingId)
  );
}

export async function getPublicManageBookingData({
  slug,
  bookingId,
  token,
}: {
  slug: string;
  bookingId?: string;
  token?: string;
}) {
  noStore();

  if (!isValidBookingManageToken({ slug, bookingId, token })) {
    return null;
  }

  if (!bookingId || !isPocketBaseConfigured()) {
    const localBooking = await getLocalPublicManageBookingData(bookingId);

    if (!localBooking || localBooking.businessSlug !== slug) {
      return null;
    }

    return {
      ...localBooking,
      source: "local" as const,
    };
  }

  return getPocketBaseManageBookingData({ slug, bookingId });
}
