import type { PaymentStatus } from "@/types/domain";
import { decryptMPToken, encryptMPToken } from "@/server/mp-token-crypto";

// ─── Subscription pricing ────────────────────────────────────────────────────

/** Precio mensual de suscripcion en USD */
export const SUBSCRIPTION_USD_PRICE = 17;

/** Tasa ARS/USD de fallback si la API de dolar blue no responde */
export const SUBSCRIPTION_FALLBACK_ARS_RATE = 1435;

/** Calcula el precio de suscripcion en ARS dado un rate de dolar blue (o usa fallback) */
export function getSubscriptionArsPrice(blueRate: number | null): number {
  const rate = blueRate ?? SUBSCRIPTION_FALLBACK_ARS_RATE;
  return SUBSCRIPTION_USD_PRICE * rate;
}

export type BusinessPaymentSettings = {
  businessId: string;
  businessSlug: string;
  businessName: string;
  mpConnected: boolean;
  mpCollectorId?: string;
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpTokenExpiresAt?: string;
};

type BusinessPaymentSettingsSource = {
  id: string;
  slug: string;
  name: string;
  mpConnected?: boolean;
  mpCollectorId?: string;
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpTokenExpiresAt?: string;
};

export function buildBusinessPaymentSettings(
  business: BusinessPaymentSettingsSource
): BusinessPaymentSettings {
  return {
    businessId: business.id,
    businessSlug: business.slug,
    businessName: business.name,
    mpConnected: business.mpConnected ?? false,
    mpCollectorId: business.mpCollectorId,
    mpAccessToken: decryptMPToken(business.mpAccessToken) ?? undefined,
    mpRefreshToken: decryptMPToken(business.mpRefreshToken) ?? undefined,
    mpTokenExpiresAt: business.mpTokenExpiresAt,
  };
}

export type BusinessMercadoPagoTokenUpdateInput = {
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
};

export function normalizeMercadoPagoCollectorId(collectorId: string) {
  const normalized = collectorId.trim();
  return normalized ? normalized : null;
}

export function buildBusinessMercadoPagoTokenPatch(
  input: BusinessMercadoPagoTokenUpdateInput
) {
  return {
    mpAccessToken: encryptMPToken(input.mpAccessToken),
    mpRefreshToken: encryptMPToken(input.mpRefreshToken),
    mpCollectorId: input.mpCollectorId,
    mpTokenExpiresAt: input.mpTokenExpiresAt,
    mpConnected: true,
  };
}

export function buildBusinessMercadoPagoTokenClearPatch<TEmpty extends string | undefined>(
  emptyValue: TEmpty
) {
  return {
    mpAccessToken: emptyValue,
    mpRefreshToken: emptyValue,
    mpCollectorId: emptyValue,
    mpTokenExpiresAt: emptyValue,
    mpConnected: false,
  };
}

export type BookingPaymentUpdateInput = {
  bookingId: string;
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
};

export type BookingPaymentPatch = {
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  status?: "confirmed";
};

export function buildBookingPaymentPatch(
  input: BookingPaymentUpdateInput
): BookingPaymentPatch {
  const patch: BookingPaymentPatch = {
    paymentStatus: input.paymentStatus,
  };

  if (input.paymentAmount !== undefined) patch.paymentAmount = input.paymentAmount;
  if (input.paymentCurrency !== undefined) patch.paymentCurrency = input.paymentCurrency;
  if (input.paymentProvider !== undefined) patch.paymentProvider = input.paymentProvider;
  if (input.paymentPreferenceId !== undefined) patch.paymentPreferenceId = input.paymentPreferenceId;
  if (input.paymentExternalId !== undefined) patch.paymentExternalId = input.paymentExternalId;

  if (input.paymentStatus === "approved") {
    patch.status = "confirmed";
  }

  return patch;
}
