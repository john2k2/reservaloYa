import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { getPublicAppUrl } from "@/lib/runtime";
import { createLogger } from "@/server/logger";
import { buildAbsoluteBookingConfirmationUrl } from "@/server/public-booking-links";
import { timeoutSignal } from "@/lib/fetch-with-timeout";

// ─── Client (lazy singleton) ──────────────────────────────────────────────────

const logger = createLogger("MercadoPago");

function normalizeAccessToken(accessToken?: string | null) {
  const normalized = accessToken?.trim();
  return normalized ? normalized : null;
}

function getMPAccessToken(accessToken?: string) {
  if (accessToken) {
    return accessToken;
  }

  const globalAccessToken = normalizeAccessToken(process.env.MP_ACCESS_TOKEN);

  if (!globalAccessToken) {
    throw new Error("MP_ACCESS_TOKEN is not configured");
  }

  return globalAccessToken;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(normalizeAccessToken(process.env.MP_ACCESS_TOKEN));
}

export function isMercadoPagoConfiguredForBusiness(mpAccessToken?: string): boolean {
  return Boolean(normalizeAccessToken(mpAccessToken));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePaymentPreferenceInput = {
  bookingId: string;
  businessSlug: string;
  businessName: string;
  serviceName: string;
  customerEmail?: string;
  customerName: string;
  customerPhone?: string;
  priceAmount: number;  // ARS
  currency?: string;    // default: ARS
};

export type PaymentPreferenceResult =
  | { ok: true; preferenceId: string; checkoutUrl: string }
  | { ok: false; error: string };

export type RefreshMercadoPagoTokenResult =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
      collectorId?: string;
      expiresAt: string;
    }
  | { ok: false; error: string };

// ─── Create Preference ────────────────────────────────────────────────────────

// ─── Internal helper ──────────────────────────────────────────────────────────

async function createPreferenceWithClient(
  accessToken: string,
  input: CreatePaymentPreferenceInput
): Promise<PaymentPreferenceResult> {
  try {
    const appUrl = getPublicAppUrl();
    const currency = input.currency || "ARS";
    const confirmationUrl = buildAbsoluteBookingConfirmationUrl(
      input.businessSlug,
      input.bookingId
    );

    if (!confirmationUrl) {
      return { ok: false, error: "No se pudo generar el link de confirmacion del booking." };
    }
    const [firstName, ...rest] = input.customerName.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: input.bookingId,
            title: `${input.serviceName} – ${input.businessName}`,
            description: `Reserva para ${input.customerName}`,
            category_id: "services",
            quantity: 1,
            unit_price: input.priceAmount,
            currency_id: currency,
          },
        ],
        payer: input.customerEmail
          ? {
              name: firstName,
              surname: lastName,
              email: input.customerEmail,
              ...(input.customerPhone
                ? { phone: { number: input.customerPhone } }
                : {}),
            }
          : undefined,
        back_urls: {
          success: `${confirmationUrl}&payment=success`,
          failure: `${confirmationUrl}&payment=failure`,
          pending: `${confirmationUrl}&payment=pending`,
        },
        auto_return: "approved",
        external_reference: input.bookingId,
        notification_url: `${appUrl}/api/payments/webhook`,
        statement_descriptor: input.businessName.slice(0, 22),
        metadata: {
          booking_id: input.bookingId,
          business_slug: input.businessSlug,
        },
      }),
      signal: timeoutSignal(8_000),
    });

    const data = (await response.json().catch(() => null)) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message ?? `MercadoPago preference HTTP ${response.status}`,
      };
    }

    if (!data?.id) {
      return { ok: false, error: "MercadoPago no devolvió preferencia válida" };
    }

    const checkoutUrl = data.init_point ?? data.sandbox_init_point ?? "";

    return {
      ok: true,
      preferenceId: data.id,
      checkoutUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    logger.error("createPaymentPreference error", err);
    return { ok: false, error: message };
  }
}

/**
 * Crea una preferencia de pago usando el token global (fallback / dev).
 * El booking debe estar guardado con status "pending_payment" antes de llamar esto.
 */
export async function createPaymentPreference(
  input: CreatePaymentPreferenceInput
): Promise<PaymentPreferenceResult> {
  return createPreferenceWithClient(getMPAccessToken(), input);
}

/**
 * Crea una preferencia de pago usando el token OAuth del negocio.
 * Usar cuando el negocio tiene su propia cuenta de MercadoPago conectada.
 */
export async function createPaymentPreferenceForBusiness(
  input: CreatePaymentPreferenceInput,
  accessToken: string
): Promise<PaymentPreferenceResult> {
  return createPreferenceWithClient(getMPAccessToken(accessToken), input);
}

// ─── Subscription Preference ─────────────────────────────────────────────────

export type CreateSubscriptionPreferenceInput = {
  businessId: string;
  priceAmount: number; // ARS
};

/**
 * Crea una preferencia de pago para la suscripcion de la plataforma.
 * Usa el token global de MP (la plataforma cobra, no el negocio).
 */
export async function createSubscriptionPreference(
  input: CreateSubscriptionPreferenceInput
): Promise<PaymentPreferenceResult> {
  try {
    const appUrl = getPublicAppUrl();
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getMPAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: `sub-${input.businessId}`,
            title: "ReservaYa - Suscripcion mensual",
            description: "Acceso al panel de gestion de turnos",
            quantity: 1,
            unit_price: input.priceAmount,
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${appUrl}/admin/subscription/success`,
          failure: `${appUrl}/admin/subscription/pay?error=payment_failed`,
          pending: `${appUrl}/admin/subscription/pay?error=payment_pending`,
        },
        auto_return: "approved",
        external_reference: input.businessId,
        notification_url: `${appUrl}/api/payments/webhook`,
      }),
      signal: timeoutSignal(8_000),
    });

    const data = (await response.json().catch(() => null)) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message ?? `MercadoPago preference HTTP ${response.status}`,
      };
    }

    if (!data?.id) {
      return { ok: false, error: "MercadoPago no devolvio preferencia valida" };
    }

    const checkoutUrl = data.init_point ?? data.sandbox_init_point ?? "";

    return {
      ok: true,
      preferenceId: data.id,
      checkoutUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    logger.error("createSubscriptionPreference error", err);
    return { ok: false, error: message };
  }
}

// ─── Token Refresh ───────────────────────────────────────────────────────────

export async function refreshMercadoPagoAccessToken(
  refreshToken: string
): Promise<RefreshMercadoPagoTokenResult> {
  const clientId = process.env.MP_APP_ID?.trim();
  const clientSecret = process.env.MP_APP_SECRET?.trim();
  const normalizedRefreshToken = refreshToken.trim();

  if (!clientId || !clientSecret) {
    return { ok: false, error: "Mercado Pago OAuth no esta configurado en el servidor." };
  }

  if (!normalizedRefreshToken) {
    return { ok: false, error: "El refresh token de Mercado Pago no es valido." };
  }

  try {
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: normalizedRefreshToken,
      }),
      signal: timeoutSignal(8_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("refresh token error", errorBody);
      return { ok: false, error: "No se pudo renovar el acceso a Mercado Pago." };
    }

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      user_id?: string | number;
      expires_in?: number;
    };

    if (!data.access_token || !data.refresh_token || !data.expires_in) {
      return { ok: false, error: "Mercado Pago devolvio una respuesta incompleta." };
    }

    return {
      ok: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      collectorId: data.user_id != null ? String(data.user_id) : undefined,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  } catch (error) {
    logger.error("refresh token exception", error);
    return { ok: false, error: "No se pudo renovar el acceso a Mercado Pago." };
  }
}

// ─── Webhook payload schema ───────────────────────────────────────────────────

export const mpWebhookPayloadSchema = z.object({
  action: z.string().optional(),
  type: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  id: z.union([z.string(), z.number()]).optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
});

export type MPWebhookPayload = z.infer<typeof mpWebhookPayloadSchema>;

export type MPPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type MPPaymentInfo = {
  id: string;
  status: MPPaymentStatus;
  statusDetail: string;
  externalReference: string; // = bookingId
  preferenceId?: string;
  transactionAmount: number;
  currencyId: string;
  collectorId?: string;
  metadata?: {
    bookingId?: string;
    businessSlug?: string;
  };
  payerEmail?: string;
};

type MPWebhookSignatureContext = {
  paymentId?: string | null;
  requestId?: string | null;
  signatureHeader?: string | null;
};

function getMPWebhookSecret() {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}

function parseMPWebhookSignature(signatureHeader: string) {
  const pairs = signatureHeader.split(",");
  const parsed = new Map<string, string>();

  for (const pair of pairs) {
    const [rawKey, ...rawValueParts] = pair.trim().split("=");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValueParts.join("=").trim();

    if (key && value) {
      parsed.set(key, value);
    }
  }

  return {
    timestamp: parsed.get("ts") ?? null,
    hash: parsed.get("v1") ?? null,
  };
}

export function shouldVerifyMPWebhookSignature() {
  return Boolean(getMPWebhookSecret());
}

export function isValidMPWebhookSignature({
  paymentId,
  requestId,
  signatureHeader,
}: MPWebhookSignatureContext) {
  const secret = getMPWebhookSecret();

  if (!secret) {
    return true;
  }

  if (!paymentId || !requestId || !signatureHeader) {
    return false;
  }

  const { timestamp, hash } = parseMPWebhookSignature(signatureHeader);

  if (!timestamp || !hash) {
    return false;
  }

  // Rechaza firmas viejas o futuras para evitar replay attacks.
  // MP envia el ts en segundos (ver ejemplos en su documentacion).
  const timestampSeconds = Number(timestamp);
  const nowSeconds = Date.now() / 1000;

  if (!Number.isFinite(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > 300) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");
  const received = Buffer.from(hash, "utf8");
  const expected = Buffer.from(expectedHash, "utf8");

  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Obtiene la info de un pago de MP a partir de su ID.
 * Usado en el webhook para obtener el estado real del pago.
 */
export async function getMPPaymentInfo(
  paymentId: string,
  accessToken?: string
): Promise<MPPaymentInfo | null> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${getMPAccessToken(accessToken)}`,
        },
        signal: timeoutSignal(8_000),
      }
    );

    if (!response.ok) {
      logger.error("getMPPaymentInfo http error", {
        paymentId,
        status: response.status,
        body: await response.text().catch(() => ""),
      });
      return null;
    }

    const data = (await response.json().catch(() => null)) as {
      id?: string | number;
      status?: string;
      status_detail?: string;
      external_reference?: string;
      transaction_amount?: number;
      currency_id?: string;
      collector_id?: string | number;
      metadata?: unknown;
      payer?: { email?: string };
    } | null;

    if (!data) return null;

    return {
      id: String(data.id),
      status: (data.status ?? "pending") as MPPaymentStatus,
      statusDetail: data.status_detail ?? "",
      externalReference: data.external_reference ?? "",
      preferenceId:
        String(
          (data as { preference_id?: string; preferenceId?: string }).preference_id ??
            (data as { preference_id?: string; preferenceId?: string }).preferenceId ??
            ""
        ) || undefined,
      transactionAmount: data.transaction_amount ?? 0,
      currencyId: data.currency_id ?? "ARS",
      collectorId: data.collector_id != null ? String(data.collector_id) : undefined,
      metadata: {
        bookingId:
          data.metadata && typeof data.metadata === "object"
            ? String((data.metadata as { booking_id?: string }).booking_id ?? "") || undefined
            : undefined,
        businessSlug:
          data.metadata && typeof data.metadata === "object"
            ? String((data.metadata as { business_slug?: string }).business_slug ?? "") || undefined
            : undefined,
      },
      payerEmail: data.payer?.email ?? undefined,
    };
  } catch (err) {
    logger.error("getMPPaymentInfo error", err);
    return null;
  }
}

/**
 * Mapea el status de MP a nuestro PaymentStatus interno.
 */
export function mapMPStatusToPaymentStatus(
  status: MPPaymentStatus
): "pending" | "approved" | "rejected" | "cancelled" | "refunded" {
  switch (status) {
    case "approved":
    case "authorized":
      return "approved";
    case "rejected":
    case "charged_back":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}
