import { getPublicAppUrl } from "@/lib/runtime";

export type PolarServer = "sandbox" | "production";

export function getPolarServer(): PolarServer {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
}

export function isPolarConfigured(): boolean {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN?.trim() && process.env.POLAR_PRODUCT_ID?.trim()
  );
}

export function isPolarWebhookConfigured(): boolean {
  return Boolean(process.env.POLAR_WEBHOOK_SECRET?.trim());
}

export function getPolarProductId(): string | null {
  return process.env.POLAR_PRODUCT_ID?.trim() || null;
}

export function getPolarAccessToken(): string | null {
  return process.env.POLAR_ACCESS_TOKEN?.trim() || null;
}

export function getPolarWebhookSecret(): string | null {
  return process.env.POLAR_WEBHOOK_SECRET?.trim() || null;
}

export function getPolarSuccessUrl(): string {
  return `${getPublicAppUrl()}/admin/subscription/success`;
}

export function getPolarReturnUrl(): string {
  return `${getPublicAppUrl()}/admin/billing`;
}
