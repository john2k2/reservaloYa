import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminOnboardingData, getAdminSettingsData } from "@/server/queries/admin";
import OnboardingPageClient from "./onboarding-client";

interface OnboardingWrapperProps {
  searchParams: Promise<{
    error?: string;
    created?: string;
    brandingSaved?: string;
    businessUpdated?: string;
    tab?: string;
    mp?: string;
  }>;
}

export default async function OnboardingWrapper({ searchParams }: OnboardingWrapperProps) {
  const shellData = await requireAdminRouteAccess("/admin/onboarding");
  const params = await searchParams;
  const [onboardingData, settingsData] = await Promise.all([
    getAdminOnboardingData(),
    getAdminSettingsData(),
  ]);

  // Construir URL OAuth de MercadoPago server-side (para no exponer MP_APP_ID al browser)
  const mpAppId = process.env.MP_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;
  // state = businessId (PocketBase) o businessSlug (local), usado por el callback para encontrar el negocio
  const stateValue = shellData?.businessId ?? settingsData.businessSlug;
  const mpOAuthUrl = mpAppId
    ? `https://auth.mercadopago.com/authorization?client_id=${mpAppId}&response_type=code&platform_id=mp&state=${stateValue}&redirect_uri=${encodeURIComponent(redirectUri)}`
    : null;

  // Si el callback OAuth redirige con ?tab=integraciones, abrir ese tab por defecto
  const defaultTab = params.tab === "integraciones" ? "integrations" as const : undefined;

  const sd = settingsData as {
    mpConnected?: boolean;
    mpCollectorId?: string;
  } & typeof settingsData;

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
        businessName: sd.businessName,
        businessSlug: sd.businessSlug,
        email: sd.email,
        address: sd.address,
        publicUrl: sd.publicUrl,
        mpConnected: sd.mpConnected ?? false,
        mpCollectorId: sd.mpCollectorId,
        mpOAuthUrl,
        defaultTab,
        profile: {
          accent: sd.profile.accent,
          accentSoft: sd.profile.accentSoft,
          surfaceTint: sd.profile.surfaceTint,
          badge: sd.profile.badge,
          eyebrow: sd.profile.eyebrow,
          headline: sd.profile.headline,
          description: sd.profile.description,
          primaryCta: sd.profile.primaryCta,
          secondaryCta: sd.profile.secondaryCta,
          instagram: sd.profile.instagram,
          facebook: sd.profile.facebook,
          tiktok: sd.profile.tiktok,
          website: sd.profile.website,
          mapQuery: sd.profile.mapQuery,
          gallery: sd.profile.gallery,
          logoUrl: sd.profile.logoUrl,
          heroImageUrl: sd.profile.heroImageUrl,
          enableDarkMode: sd.profile.enableDarkMode,
          darkModeColors: sd.profile.darkModeColors,
        },
      }}
      searchParams={{
        error: params.error,
        created: params.created,
        brandingSaved: params.brandingSaved,
        businessUpdated: params.businessUpdated,
        tab: params.tab,
        mp: params.mp,
      }}
    />
  );
}
