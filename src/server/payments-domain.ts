import type { PaymentStatus } from "@/types/domain";
import { decryptMPToken, encryptMPToken } from "@/server/mp-token-crypto";

// ─── Subscription pricing ────────────────────────────────────────────────────

/**
 * Precio promo / transferencia (USD de referencia).
 * En ARS se convierte con dólar blue — es el precio que empujamos.
 */
export const SUBSCRIPTION_USD_PRICE = 22;

/**
 * Precio tarjeta (Polar) pensado para dejar ~USD 22 netos tras fees MoR.
 * El monto real lo define el producto en Polar; este valor es la UI/contrato.
 */
export const SUBSCRIPTION_CARD_USD_PRICE = 27;

/**
 * Calcula el precio promo de suscripcion en ARS (transferencia) dado un rate blue.
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

/** Días de gracia tras `nextBillingDate` antes de tratar una suscripción `active` como vencida. */
export const SUBSCRIPTION_BILLING_GRACE_DAYS = 3;

/**
 * Una suscripción `active` está vencida si pasó `nextBillingDate` + el período de gracia.
 * Sin `nextBillingDate` (no debería ocurrir para un sub activo) se asume no vencida
 * para no bloquear negocios existentes por falta de dato.
 */
export function isActiveSubscriptionExpired(
  nextBillingDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!nextBillingDate) return false;
  const graceMs = SUBSCRIPTION_BILLING_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return new Date(nextBillingDate).getTime() + graceMs < now.getTime();
}

/** Días antes de `trialEndsAt` en que se avisa al negocio que el trial termina. */
export const SUBSCRIPTION_TRIAL_ENDING_NOTICE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Un trial está "por vencer" si `trialEndsAt` cae dentro de la ventana de aviso
 * y todavía no pasó. Ya vencido devuelve false (no tiene sentido avisar tarde).
 */
export function isTrialEndingSoon(
  trialEndsAt: string | null | undefined,
  now: Date = new Date(),
  noticeDays: number = SUBSCRIPTION_TRIAL_ENDING_NOTICE_DAYS
): boolean {
  if (!trialEndsAt) return false;
  const endsMs = new Date(trialEndsAt).getTime();
  const nowMs = now.getTime();
  return endsMs >= nowMs && endsMs - nowMs <= noticeDays * DAY_MS;
}

/** Días enteros que faltan hasta `trialEndsAt` (mínimo 0). */
export function trialDaysLeft(
  trialEndsAt: string | null | undefined,
  now: Date = new Date()
): number {
  if (!trialEndsAt) return 0;
  const diffMs = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / DAY_MS));
}

/**
 * Una suscripción `active` está en período de dunning si venció su
 * `nextBillingDate` pero todavía no superó la gracia (aún no se suspende).
 * Es la ventana en la que conviene recordarle al negocio que pague.
 */
export function isActiveSubscriptionInDunning(
  nextBillingDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!nextBillingDate) return false;
  const overdue = new Date(nextBillingDate).getTime() < now.getTime();
  return overdue && !isActiveSubscriptionExpired(nextBillingDate, now);
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
