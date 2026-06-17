import { getSupabaseAdminClient, updateSupabaseRecord } from "./_core";
import { buildBusinessMercadoPagoTokenPatch, buildBusinessMercadoPagoTokenClearPatch, normalizeMercadoPagoCollectorId } from "@/server/payments-domain";
import { decryptMPToken } from "@/server/mp-token-crypto";
import type { BusinessRecord } from "@/server/supabase-domain";

export async function updateSupabaseBusinessMPTokens(input: {
  businessId: string;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
}) {
  await updateSupabaseRecord("businesses", input.businessId, buildBusinessMercadoPagoTokenPatch(input));
}

export async function clearSupabaseBusinessMPTokens(businessId: string) {
  await updateSupabaseRecord("businesses", businessId, buildBusinessMercadoPagoTokenClearPatch(""));
}

export async function getSupabaseBusinessPaymentSettingsByCollectorId(
  collectorId: string
) {
  const client = await getSupabaseAdminClient();
  const normalizedCollectorId = normalizeMercadoPagoCollectorId(collectorId);

  const { data, error } = await client
    .from("businesses")
    .select("id, slug, name, mpConnected, mpCollectorId, mpAccessToken, mpRefreshToken, mpTokenExpiresAt")
    .eq("mpCollectorId", normalizedCollectorId)
    .single();

  if (error || !data) return null;

  const business = data as BusinessRecord;

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
