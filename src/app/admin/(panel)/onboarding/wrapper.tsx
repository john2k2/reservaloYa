import { requireAdminRouteAccess } from "@/server/admin-access";
import { getAdminOnboardingData, getAdminSettingsData } from "@/server/queries/admin";
import { env } from "@/lib/env";
import EditBusinessPage from "./edit-business-page";
import OnboardingWizard from "./onboarding-wizard";

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
  await requireAdminRouteAccess("/admin/onboarding");
  const params = await searchParams;
  const [onboardingData, settingsData] = await Promise.all([
    getAdminOnboardingData(),
    getAdminSettingsData(),
  ]);

  // Construir URL OAuth de MercadoPago server-side (para no exponer MP_APP_ID al browser)
  const mpAppId = env.MP_APP_ID?.trim();
  const mpAppSecret = env.MP_APP_SECRET?.trim();
  const mpOAuthUrl = mpAppId && mpAppSecret ? "/api/auth/mercadopago/start" : null;
  const whatsappConfigured = !!(
    env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN
  );

  // Si el callback OAuth redirige con ?tab=integraciones, abrir ese tab por defecto
  const defaultTab = params.tab === "integraciones" ? "integrations" as const : undefined;

  const sd = settingsData as {
    mpConnected?: boolean;
    mpCollectorId?: string;
    cancellationPolicy?: string;
    autoConfirmBookings?: boolean;
  } & typeof settingsData;

  const businesses = onboardingData.businesses.map((b) => ({
    slug: b.slug,
    name: b.name,
    phone: b.phone,
  }));

  const resolvedSettingsData = {
    businessName: sd.businessName,
    businessSlug: sd.businessSlug,
    email: sd.email,
    address: sd.address,
    publicUrl: sd.publicUrl,
    cancellationPolicy: sd.cancellationPolicy,
    autoConfirmBookings: sd.autoConfirmBookings ?? false,
    mpConnected: sd.mpConnected ?? false,
    mpCollectorId: sd.mpCollectorId,
    mpOAuthUrl,
    whatsappConfigured,
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
  };

  // Decisión wizard vs. editor (misma regla de negocio que antes, solo se movió
  // acá desde onboarding-wizard.tsx): si ya existe un negocio, se muestra el editor
  // completo en vez del wizard guiado de 4 pasos.
  const hasExistingBusiness = businesses.length > 0;
  const activeBusinessSlug = onboardingData.activeBusinessSlug ?? resolvedSettingsData.businessSlug;
  const activeBusiness = hasExistingBusiness
    ? businesses.find((b) => b.slug === activeBusinessSlug) || businesses[0]
    : null;

  if (hasExistingBusiness && activeBusiness) {
    return <EditBusinessPage business={activeBusiness} settingsData={resolvedSettingsData} />;
  }

  return (
    <OnboardingWizard
      onboardingData={{
        demoMode: onboardingData.demoMode,
        templates: onboardingData.templates,
        businesses,
        activeBusinessSlug: onboardingData.activeBusinessSlug,
      }}
      settingsData={resolvedSettingsData}
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
