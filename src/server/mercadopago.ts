import MercadoPago, { Preference, Payment } from "mercadopago";

// ─── Client (lazy singleton) ──────────────────────────────────────────────────

let mpClient: MercadoPago | null = null;

function getMPClient(): MercadoPago {
  if (!mpClient) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN is not configured");
    }
    mpClient = new MercadoPago({ accessToken });
  }
  return mpClient;
}

export function isMercadoPagoConfigured(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

export function isMercadoPagoConfiguredForBusiness(mpAccessToken?: string): boolean {
  return Boolean(mpAccessToken);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePaymentPreferenceInput = {
  bookingId: string;
  businessSlug: string;
  businessName: string;
  serviceName: string;
  customerEmail?: string;
  customerName: string;
  priceAmount: number;  // ARS
  currency?: string;    // default: ARS
};

export type PaymentPreferenceResult =
  | { ok: true; preferenceId: string; checkoutUrl: string }
  | { ok: false; error: string };

// ─── Create Preference ────────────────────────────────────────────────────────

// ─── Internal helper ──────────────────────────────────────────────────────────

async function createPreferenceWithClient(
  client: MercadoPago,
  input: CreatePaymentPreferenceInput
): Promise<PaymentPreferenceResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const currency = input.currency || "ARS";

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: input.bookingId,
            title: `${input.serviceName} – ${input.businessName}`,
            description: `Reserva para ${input.customerName}`,
            quantity: 1,
            unit_price: input.priceAmount,
            currency_id: currency,
          },
        ],
        payer: input.customerEmail
          ? {
              name: input.customerName,
              email: input.customerEmail,
            }
          : undefined,
        back_urls: {
          success: `${appUrl}/${input.businessSlug}/confirmacion?booking=${input.bookingId}&payment=success`,
          failure: `${appUrl}/${input.businessSlug}/confirmacion?booking=${input.bookingId}&payment=failure`,
          pending: `${appUrl}/${input.businessSlug}/confirmacion?booking=${input.bookingId}&payment=pending`,
        },
        auto_return: "approved",
        external_reference: input.bookingId,
        notification_url: `${appUrl}/api/payments/webhook`,
        statement_descriptor: input.businessName.slice(0, 22),
        metadata: {
          booking_id: input.bookingId,
          business_slug: input.businessSlug,
        },
      },
    });

    if (!response.id) {
      return { ok: false, error: "MercadoPago no devolvió preferencia válida" };
    }

    const checkoutUrl = response.init_point ?? response.sandbox_init_point ?? "";

    return {
      ok: true,
      preferenceId: response.id,
      checkoutUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[MercadoPago] createPaymentPreference error:", err);
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
  return createPreferenceWithClient(getMPClient(), input);
}

/**
 * Crea una preferencia de pago usando el token OAuth del negocio.
 * Usar cuando el negocio tiene su propia cuenta de MercadoPago conectada.
 */
export async function createPaymentPreferenceForBusiness(
  input: CreatePaymentPreferenceInput,
  accessToken: string
): Promise<PaymentPreferenceResult> {
  return createPreferenceWithClient(new MercadoPago({ accessToken }), input);
}

// ─── Webhook payload types ────────────────────────────────────────────────────

export type MPWebhookPayload = {
  action?: string;        // "payment.created" | "payment.updated"
  type?: string;          // "payment"
  data?: { id?: string }; // payment ID
  id?: string | number;   // también puede venir aquí
};

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
  transactionAmount: number;
  currencyId: string;
  payerEmail?: string;
};

/**
 * Obtiene la info de un pago de MP a partir de su ID.
 * Usado en el webhook para obtener el estado real del pago.
 */
export async function getMPPaymentInfo(paymentId: string): Promise<MPPaymentInfo | null> {
  try {
    const payment = new Payment(getMPClient());
    const response = await payment.get({ id: paymentId });

    if (!response) return null;

    return {
      id: String(response.id),
      status: (response.status ?? "pending") as MPPaymentStatus,
      statusDetail: response.status_detail ?? "",
      externalReference: response.external_reference ?? "",
      transactionAmount: response.transaction_amount ?? 0,
      currencyId: response.currency_id ?? "ARS",
      payerEmail: response.payer?.email ?? undefined,
    };
  } catch (err) {
    console.error("[MercadoPago] getMPPaymentInfo error:", err);
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
