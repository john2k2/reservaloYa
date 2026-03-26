import {
  isMercadoPagoConfiguredForBusiness,
  refreshMercadoPagoAccessToken,
} from "@/server/mercadopago";
import { createLogger } from "@/server/logger";

const logger = createLogger("MercadoPago OAuth");

export type BusinessMercadoPagoSettings = {
  businessId: string;
  businessSlug: string;
  businessName: string;
  mpConnected: boolean;
  mpCollectorId?: string | null;
  mpAccessToken?: string | null;
  mpRefreshToken?: string | null;
  mpTokenExpiresAt?: string | null;
};

export type PersistBusinessMercadoPagoTokensInput = {
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
};

function isExpiringSoon(expiresAt?: string | null) {
  if (!expiresAt) {
    return false;
  }

  const parsed = Date.parse(expiresAt);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return parsed <= Date.now() + 60_000;
}

export async function getUsableBusinessMercadoPagoAccessToken(
  settings: BusinessMercadoPagoSettings | null | undefined,
  persistTokens: (input: PersistBusinessMercadoPagoTokensInput) => Promise<unknown>
) {
  if (!settings?.mpConnected) {
    return null;
  }

  const currentAccessToken = settings.mpAccessToken?.trim() || null;
  const currentRefreshToken = settings.mpRefreshToken?.trim() || null;

  if (currentAccessToken && !isExpiringSoon(settings.mpTokenExpiresAt)) {
    return currentAccessToken;
  }

  if (!currentRefreshToken) {
    return isMercadoPagoConfiguredForBusiness(currentAccessToken ?? undefined)
      ? currentAccessToken
      : null;
  }

  const refreshed = await refreshMercadoPagoAccessToken(currentRefreshToken);

  if (!refreshed.ok) {
    logger.error(`No se pudo renovar el token para ${settings.businessSlug}: ${refreshed.error}`);
    return null;
  }

  await persistTokens({
    mpAccessToken: refreshed.accessToken,
    mpRefreshToken: refreshed.refreshToken,
    mpCollectorId: refreshed.collectorId ?? settings.mpCollectorId?.trim() ?? "",
    mpTokenExpiresAt: refreshed.expiresAt,
  });

  return refreshed.accessToken;
}
