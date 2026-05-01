import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().min(1).optional(),
  BOOKING_LINK_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  
  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  
  // MercadoPago
  MP_APP_ID: z.string().min(1).optional(),
  MP_APP_SECRET: z.string().min(1).optional(),
  MP_ACCESS_TOKEN: z.string().min(1).optional(),
  MP_WEBHOOK_SECRET: z.string().min(1).optional(),
  
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(),
  TWILIO_WHATSAPP_TEMPLATE_SID: z.string().min(1).optional(),
  
  // WhatsApp Business
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  
  // Platform
  PLATFORM_SUPERADMIN_EMAIL: z.string().email().optional(),
  
  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  
  // Pricing
  SUBSCRIPTION_PRICE_USD: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
    console.error("❌ Invalid environment variables:", errors);
    
    // Don't throw in production to avoid crashing the app
    // Just log the error and return partial env
    if (process.env.NODE_ENV === "production") {
      return (parsed.data ?? {}) as Env;
    }
  }
  
  return (parsed.data ?? {}) as Env;
}

export const env = parseEnv();

// Helper functions for common env access
export function getRequiredEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnv(key: keyof typeof env): string | undefined {
  return env[key];
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}
