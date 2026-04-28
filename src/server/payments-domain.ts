import type { PaymentStatus } from "@/types/domain";
import { decryptMPToken, encryptMPToken } from "@/server/mp-token-crypto";

// ─── Subscription pricing ────────────────────────────────────────────────────

/** Precio mensual de suscripcion en USD */
export const SUBSCRIPTION_USD_PRICE = 22;

/**
 * Calcula el precio de suscripcion en ARS dado un rate de dolar blue.
 *
 * El rate viene de `getBlueDollarRate()` que:
 * - Consulta APIs en tiempo real (cache 1hs)
 * - Si fallan, lee el último valor persistido en Supabase
 * - Solo devuelve null si nunca se obtuvo un rate (primer deploy con APIs caídas)
 *
 * Si blueRate es null, estamos en una situación excepcional y devolvemos 0
 * para que el llamador decida qué hacer (mostrar error, no permitir pago, etc.)
 */
export function getSubscriptionArsPrice(blueRate: number | null): number {
  if (!blueRate) {
    console.error("[Payments] No hay tipo de cambio disponible. No se puede calcular el precio.");
    return 0;
  }
  return SUBSCRIPTION_USD_PRICE * blueRate;
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

export type BookingPaymentValidationContext = {
  bookingId: string;
  businessId: string;
  businessSlug: string;
  status: "pending" | "pending_payment" | "confirmed" | "completed" | "cancelled" | "no_show";
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  paymentStatus?: PaymentStatus;
  mpCollectorId?: string;
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
