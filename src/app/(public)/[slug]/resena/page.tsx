import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

import { formatDateLabel } from "@/lib/bookings/format";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import { getBookingConfirmationData, getPublicBusinessPageData } from "@/server/queries/public";
import { getPublicBusinessProfile } from "@/constants/public-business-profiles";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { ReviewForm } from "@/components/public/review/review-form";

type ReviewPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; token?: string }>;
};

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { slug } = await params;
  const { booking: bookingId, token } = await searchParams;

  if (!isValidBookingManageToken({ slug, bookingId, token })) {
    notFound();
  }

  const [confirmation, pageData] = await Promise.all([
    getBookingConfirmationData({ slug, bookingId }),
    getPublicBusinessPageData(slug),
  ]);

  if (!confirmation) {
    notFound();
  }

  const profile =
    pageData?.profile ?? getPublicBusinessProfile(slug, slug);

  const accentColor = profile.accent ?? "#3b82f6";

  return (
    <PublicBusinessPageWrapper profile={profile}>
      <main className="min-h-screen bg-background px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {confirmation.businessName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              ¿Cómo fue tu experiencia?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmation.serviceName} · {formatDateLabel(confirmation.bookingDate)}
            </p>
          </div>

          <ReviewForm
            businessSlug={slug}
            bookingId={bookingId!}
            manageToken={token!}
            serviceId={confirmation.serviceId ?? ""}
            customerName={confirmation.customerName}
            accentColor={accentColor}
          />
        </div>
      </main>
    </PublicBusinessPageWrapper>
  );
}
