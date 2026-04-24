import { createLogger } from "@/server/logger";

const logger = createLogger("WhatsApp Meta");

export type WhatsAppSendResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

export function isMetaWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN
  );
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\s/g, "");
  return digits.startsWith("+") ? digits.slice(1) : digits;
}

type TemplateComponent = {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
  sub_type?: string;
  index?: number;
};

async function sendTemplate(input: {
  to: string;
  templateName: string;
  languageCode: string;
  components: TemplateComponent[];
}): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { status: "skipped", reason: "meta_whatsapp_not_configured" };
  }

  const body = {
    messaging_product: "whatsapp",
    to: normalizePhone(input.to),
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode },
      components: input.components,
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code: number };
    };

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      logger.error(`WhatsApp template error (${input.templateName})`, errMsg);
      return { status: "error", error: errMsg };
    }

    const messageId = data.messages?.[0]?.id ?? "";
    logger.info(`WhatsApp enviado a ${input.to} (id: ${messageId})`);
    return { status: "sent", messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("WhatsApp fetch failed", err);
    return { status: "error", error: message };
  }
}

// ─── Template senders ─────────────────────────────────────────────────────────
// Cada función corresponde a un template aprobado en Meta Business Manager.
// Nombre del template → variables en orden → texto en Meta.
//
// reservaya_confirmacion: "ReservaYa - {{1}} ✅ | Hola {{2}}, tu turno de {{3}}
//   está confirmado para el {{4}} a las {{5}} hs. Gestioná tu reserva: {{6}}"
//
// reservaya_recordatorio: "ReservaYa - {{1}} ⏰ | Hola {{2}}, te recordamos
//   tu turno de {{3}} para el {{4}} a las {{5}} hs. Gestionalo desde: {{6}}"
//
// reservaya_resena: "ReservaYa - {{1}} ⭐ | Hola {{2}}, ¿cómo estuvo tu {{3}}?
//   Nos encantaría tu opinión: {{4}}"

export async function sendConfirmationWhatsApp(input: {
  customerPhone: string;
  businessName: string;
  customerName: string;
  serviceName: string;
  dateLabel: string;
  time: string;
  manageUrl: string;
}): Promise<WhatsAppSendResult> {
  return sendTemplate({
    to: input.customerPhone,
    templateName: "reservaya_confirmacion",
    languageCode: "es",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: input.businessName },
          { type: "text", text: input.customerName },
          { type: "text", text: input.serviceName },
          { type: "text", text: input.dateLabel },
          { type: "text", text: input.time },
          { type: "text", text: input.manageUrl },
        ],
      },
    ],
  });
}

export async function sendReminderWhatsApp(input: {
  customerPhone: string;
  businessName: string;
  customerName: string;
  serviceName: string;
  dateLabel: string;
  time: string;
  manageUrl: string;
}): Promise<WhatsAppSendResult> {
  return sendTemplate({
    to: input.customerPhone,
    templateName: "reservaya_recordatorio",
    languageCode: "es",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: input.businessName },
          { type: "text", text: input.customerName },
          { type: "text", text: input.serviceName },
          { type: "text", text: input.dateLabel },
          { type: "text", text: input.time },
          { type: "text", text: input.manageUrl },
        ],
      },
    ],
  });
}

export async function sendReviewRequestWhatsApp(input: {
  customerPhone: string;
  businessName: string;
  customerName: string;
  serviceName: string;
  reviewUrl: string;
}): Promise<WhatsAppSendResult> {
  return sendTemplate({
    to: input.customerPhone,
    templateName: "reservaya_resena",
    languageCode: "es",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: input.businessName },
          { type: "text", text: input.customerName },
          { type: "text", text: input.serviceName },
          { type: "text", text: input.reviewUrl },
        ],
      },
    ],
  });
}
