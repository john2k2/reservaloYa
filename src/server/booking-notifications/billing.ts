import { createLogger } from "@/server/logger";
import {
  getBaseUrl,
  buildSubscriptionSuspendedEmailHtml,
  buildTrialEndingEmailHtml,
  buildDunningEmailHtml,
} from "../email-templates";
import { SUBSCRIPTION_BILLING_GRACE_DAYS } from "../payments-domain";
import { getFromEmail, sendResendEmail, type BookingEmailResult } from "./email-core";

const logger = createLogger("Booking Notifications");

/**
 * Avisa al negocio que su prueba gratis está por terminar.
 * Best-effort: nunca debe bloquear el sweep de facturación.
 */
export async function sendTrialEndingEmail(input: {
  businessName: string;
  businessEmail: string;
  daysLeft: number;
}): Promise<BookingEmailResult> {
  if (!input.businessEmail) {
    return { status: "skipped", reason: "no_business_email" };
  }

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail("ReservaYa"),
      to: [input.businessEmail],
      subject: "Tu prueba gratis de ReservaYa está por terminar",
      html: buildTrialEndingEmailHtml({
        businessName: input.businessName,
        daysLeft: input.daysLeft,
        billingUrl: `${getBaseUrl()}/admin/subscription`,
      }),
      tags: [{ name: "type", value: "trial_ending" }],
    });

    if (error) {
      logger.error("Resend error (trial ending)", error);
      return { status: "error", error: error.message };
    }

    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send trial ending email", err);
    return { status: "error", error: message };
  }
}

/**
 * Avisa al negocio que su pago está vencido (dentro del período de gracia),
 * antes de suspenderlo. Best-effort: nunca debe bloquear el sweep.
 */
export async function sendDunningEmail(input: {
  businessName: string;
  businessEmail: string;
}): Promise<BookingEmailResult> {
  if (!input.businessEmail) {
    return { status: "skipped", reason: "no_business_email" };
  }

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail("ReservaYa"),
      to: [input.businessEmail],
      subject: "No pudimos registrar tu pago de ReservaYa",
      html: buildDunningEmailHtml({
        businessName: input.businessName,
        billingUrl: `${getBaseUrl()}/admin/subscription`,
        graceDays: SUBSCRIPTION_BILLING_GRACE_DAYS,
      }),
      tags: [{ name: "type", value: "dunning" }],
    });

    if (error) {
      logger.error("Resend error (dunning)", error);
      return { status: "error", error: error.message };
    }

    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send dunning email", err);
    return { status: "error", error: message };
  }
}

/**
 * Notifica al negocio que su suscripción quedó suspendida por falta de pago.
 * El envío es best-effort: nunca debe bloquear el sweep de facturación.
 */
export async function sendSubscriptionSuspendedEmail(input: {
  businessName: string;
  businessEmail: string;
}): Promise<BookingEmailResult> {
  if (!input.businessEmail) {
    return { status: "skipped", reason: "no_business_email" };
  }

  try {
    const { data, error } = await sendResendEmail({
      from: getFromEmail("ReservaYa"),
      to: [input.businessEmail],
      subject: "Tu suscripción a ReservaYa quedó suspendida",
      html: buildSubscriptionSuspendedEmailHtml({
        businessName: input.businessName,
        billingUrl: `${getBaseUrl()}/admin/subscription`,
      }),
      tags: [{ name: "type", value: "subscription_suspended" }],
    });

    if (error) {
      logger.error("Resend error (subscription suspended)", error);
      return { status: "error", error: error.message };
    }

    return { status: "sent", messageId: data?.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to send subscription suspended email", err);
    return { status: "error", error: message };
  }
}
