import { unstable_cache, unstable_noStore as noStore } from "next/cache";

import { demoSlots } from "@/constants/demo";
import {
  hasPocketBasePublicAuthCredentials,
  isPocketBaseConfigured,
} from "@/lib/pocketbase/config";
import { isValidBookingConfirmationToken } from "@/server/public-booking-links";
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

function canUsePocketBasePublicReads() {
  return isPocketBaseConfigured() && hasPocketBasePublicAuthCredentials();
}

async function getPocketBasePublicBusinessPageDataSafe(slug: string) {
  try {
    return await getCachedPocketBasePublicBusinessPageData(slug);
  } catch {
    return null;
  }
}

export async function getPublicBusinessPageData(slug: string) {
  if (!canUsePocketBasePublicReads()) {
    return getCachedLocalPublicBusinessPageData(slug);
  }

  const pocketBaseData = await getPocketBasePublicBusinessPageDataSafe(slug);

  if (pocketBaseData) {
    return pocketBaseData;
  }

  return getCachedLocalPublicBusinessPageData(slug);
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

  if (!canUsePocketBasePublicReads() || pageData.source === "local") {
    return getLocalPublicBookingFlowData({
      slug,
      serviceId,
      bookingDate,
    });
  }

  try {
    return await getPocketBasePublicBookingFlowData(
      { slug, serviceId, bookingDate },
      pageData
    );
  } catch {
    return getLocalPublicBookingFlowData({
      slug,
      serviceId,
      bookingDate,
    });
  }
}

export async function getBookingConfirmationData({
  slug,
  bookingId,
  token,
  skipTokenValidation = false,
}: {
  slug: string;
  bookingId?: string;
  token?: string;
  skipTokenValidation?: boolean;
}) {
  noStore();

  if (
    !skipTokenValidation &&
    !isValidBookingConfirmationToken({ slug, bookingId, token })
  ) {
    return null;
  }

  if (!bookingId || !canUsePocketBasePublicReads()) {
    const localBooking = await getLocalBookingConfirmationData(bookingId);

    if (!localBooking || localBooking.businessSlug !== slug) {
      return null;
    }

    return localBooking;
  }

  const pocketBaseBooking = await getPocketBaseBookingConfirmationData({ slug, bookingId }).catch(
    () => null
  );

  if (pocketBaseBooking) {
    return pocketBaseBooking;
  }

  const localBooking = await getLocalBookingConfirmationData(bookingId);
  if (!localBooking || localBooking.businessSlug !== slug) {
    return null;
  }

  return localBooking;
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

  if (!bookingId || !canUsePocketBasePublicReads()) {
    const localBooking = await getLocalPublicManageBookingData(bookingId);

    if (!localBooking || localBooking.businessSlug !== slug) {
      return null;
    }

    return {
      ...localBooking,
      source: "local" as const,
    };
  }
  return getPocketBaseManageBookingData({ slug, bookingId }).catch(() => null);
}
