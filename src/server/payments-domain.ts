import type { PaymentStatus } from "@/types/domain";

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
    mpAccessToken: business.mpAccessToken,
    mpRefreshToken: business.mpRefreshToken,
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
    mpAccessToken: input.mpAccessToken,
    mpRefreshToken: input.mpRefreshToken,
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
