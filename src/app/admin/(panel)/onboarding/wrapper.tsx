import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminOnboardingData, getAdminSettingsData } from "@/server/queries/admin";
import OnboardingPageClient from "./onboarding-client";

interface OnboardingWrapperProps {
  searchParams: Promise<{ error?: string; created?: string; brandingSaved?: string; businessUpdated?: string }>;
}

export default async function OnboardingWrapper({ searchParams }: OnboardingWrapperProps) {
  await requireAdminRouteAccess("/admin/onboarding");
  const params = await searchParams;
  const [onboardingData, settingsData] = await Promise.all([
    getAdminOnboardingData(),
    getAdminSettingsData(),
  ]);

  return (
    <OnboardingPageClient
      onboardingData={{
        demoMode: onboardingData.demoMode,
        templates: onboardingData.templates,
        businesses: onboardingData.businesses.map((b) => ({
          slug: b.slug,
          name: b.name,
          phone: b.phone,
        })),
        activeBusinessSlug: onboardingData.activeBusinessSlug,
      }}
      settingsData={{
        businessName: settingsData.businessName,
        businessSlug: settingsData.businessSlug,
        email: settingsData.email,
        address: settingsData.address,
        publicUrl: settingsData.publicUrl,
        profile: {
          accent: settingsData.profile.accent,
          accentSoft: settingsData.profile.accentSoft,
          surfaceTint: settingsData.profile.surfaceTint,
          badge: settingsData.profile.badge,
          eyebrow: settingsData.profile.eyebrow,
          headline: settingsData.profile.headline,
          description: settingsData.profile.description,
          primaryCta: settingsData.profile.primaryCta,
          secondaryCta: settingsData.profile.secondaryCta,
          instagram: settingsData.profile.instagram,
          facebook: settingsData.profile.facebook,
          tiktok: settingsData.profile.tiktok,
          website: settingsData.profile.website,
          mapQuery: settingsData.profile.mapQuery,
          gallery: settingsData.profile.gallery,
          logoUrl: settingsData.profile.logoUrl,
          heroImageUrl: settingsData.profile.heroImageUrl,
          enableDarkMode: settingsData.profile.enableDarkMode,
          darkModeColors: settingsData.profile.darkModeColors,
        },
      }}
      searchParams={{
        error: params.error,
        created: params.created,
        brandingSaved: params.brandingSaved,
        businessUpdated: params.businessUpdated,
      }}
    />
  );
}
