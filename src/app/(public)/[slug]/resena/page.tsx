import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";

import { formatDateLabel } from "@/lib/bookings/format";
import { isValidBookingReviewToken } from "@/server/public-booking-links";
import { getBookingConfirmationData, getPublicBusinessPageData } from "@/server/queries/public";
import { resolvePublicProfile } from "@/constants/public-business-profiles";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";
import { TransactionalPageShell } from "@/components/public/transactional-page-shell";
import { ReviewForm } from "@/components/public/review/review-form";
import { generateTransactionalMetadata } from "@/lib/seo/business-metadata";

// cache() memoiza por request — generateMetadata y el componente comparten el mismo fetch
const getPageData = cache(getPublicBusinessPageData);

type ReviewPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; token?: string }>;
};

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPageData(slug);

  return generateTransactionalMetadata({
    businessName: pageData?.business.name,
    slug,
    pathSuffix: "/resena",
    titlePrefix: "Dejar reseña",
  });
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { slug } = await params;
  const { booking: bookingId, token } = await searchParams;

  if (!isValidBookingReviewToken({ slug, bookingId, token })) {
    notFound();
  }

  const [confirmation, pageData] = await Promise.all([
    getBookingConfirmationData({ slug, bookingId, token, skipTokenValidation: true }),
    getPageData(slug),
  ]);

  if (!confirmation) {
    notFound();
  }

  const profile = resolvePublicProfile(pageData, slug);

  const accentColor = profile.accent ?? "#3b82f6";

  return (
    <PublicBusinessPageWrapper profile={profile}>
      <TransactionalPageShell accentColor={accentColor} surfaceTint={pageData?.profile?.surfaceTint}>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
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
            accentColor={accentColor}
          />
        </div>
      </TransactionalPageShell>
    </PublicBusinessPageWrapper>
  );
}
