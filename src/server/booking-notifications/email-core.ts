import { timeoutSignal } from "@/lib/fetch-with-timeout";

export type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
};

export type BookingEmailResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

export async function sendResendEmail(payload: ResendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: timeoutSignal(10_000),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
  } | null;

  if (!response.ok) {
    return {
      data: null,
      error: {
        message: body?.message ?? body?.name ?? `Resend HTTP ${response.status}`,
      },
    };
  }

  return { data: { id: body?.id ?? "" }, error: null };
}

/**
 * FROM email: usa dominio verificado si está configurado,
 * si no usa onboarding@resend.dev (gratuito, no requiere dominio propio).
 * Nota: con onboarding@resend.dev solo se puede enviar a emails verificados
 * en Resend en modo test. Para producción real configurar RESEND_FROM_EMAIL
 * con un dominio propio verificado.
 */
export function getFromEmail(businessName?: string): string {
  const configured = process.env.RESEND_FROM_EMAIL;
  const from = configured || "onboarding@resend.dev";
  return businessName ? `${businessName} <${from}>` : `ReservaYa <${from}>`;
}
