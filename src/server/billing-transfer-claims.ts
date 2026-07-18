import { createAdminClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_USD_PRICE } from "@/server/payments-domain";
import { activateSupabaseSubscription } from "@/server/supabase-store/subscription";

export const BILLING_RECEIPTS_BUCKET = "billing-receipts";
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RECEIPT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type TransferClaimStatus = "pending" | "approved" | "rejected";

export type TransferClaimRow = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  ownerEmail: string;
  amountArs: number | null;
  currency: string;
  receiptPath: string;
  receiptMime: string | null;
  status: TransferClaimStatus;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  receiptUrl: string | null;
};

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

export async function getPendingTransferClaimForBusiness(businessId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("billing_transfer_claims")
    .select("id, status, created, amount_ars")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .order("created", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data
    ? {
        id: data.id as string,
        status: data.status as TransferClaimStatus,
        createdAt: data.created as string,
        amountArs: data.amount_ars == null ? null : Number(data.amount_ars),
      }
    : null;
}

export async function submitTransferClaim(input: {
  businessId: string;
  amountArs: number | null;
  file: File;
}) {
  const mime = input.file.type || "application/octet-stream";
  if (!ALLOWED_RECEIPT_MIME.has(mime)) {
    throw new Error("Formato inválido. Subí JPG, PNG, WEBP o PDF.");
  }
  if (input.file.size <= 0 || input.file.size > MAX_RECEIPT_BYTES) {
    throw new Error("El archivo debe pesar menos de 5 MB.");
  }

  const client = createAdminClient();
  const existing = await getPendingTransferClaimForBusiness(input.businessId);
  if (existing) {
    throw new Error("Ya tenés un comprobante pendiente de revisión.");
  }

  const ext = extForMime(mime);
  const path = `${input.businessId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await client.storage
    .from(BILLING_RECEIPTS_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    throw new Error(`No se pudo subir el comprobante: ${uploadError.message}`);
  }

  const { data, error } = await client
    .from("billing_transfer_claims")
    .insert({
      business_id: input.businessId,
      amount_ars: input.amountArs,
      currency: "ARS",
      receipt_path: path,
      receipt_mime: mime,
      status: "pending",
    })
    .select("id, created")
    .single();

  if (error) {
    await client.storage.from(BILLING_RECEIPTS_BUCKET).remove([path]);
    throw new Error(`No se pudo registrar el comprobante: ${error.message}`);
  }

  return { id: data.id as string, createdAt: data.created as string };
}

async function signedReceiptUrl(path: string): Promise<string | null> {
  const client = createAdminClient();
  const { data, error } = await client.storage
    .from(BILLING_RECEIPTS_BUCKET)
    .createSignedUrl(path, 60 * 30);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function listTransferClaims(options?: {
  status?: TransferClaimStatus | "all";
  limit?: number;
}): Promise<TransferClaimRow[]> {
  const client = createAdminClient();
  const limit = options?.limit ?? 30;
  let query = client
    .from("billing_transfer_claims")
    .select(
      "id, business_id, amount_ars, currency, receipt_path, receipt_mime, status, note, created, reviewed_at"
    )
    .order("created", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const businessIds = [...new Set(rows.map((r) => r.business_id as string))];
  const { data: businesses } = await client
    .from("businesses")
    .select("id, name, slug")
    .in("id", businessIds);

  const bizMap = new Map((businesses ?? []).map((b) => [b.id as string, b]));

  const { data: owners } = await client
    .from("app_users")
    .select("id, business_id, role, active")
    .in("business_id", businessIds)
    .eq("role", "owner");

  const { data: authUsers } = await client.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const ownerEmailByBiz = new Map<string, string>();
  for (const owner of owners ?? []) {
    if (owner.active === false) continue;
    if (!ownerEmailByBiz.has(owner.business_id as string)) {
      ownerEmailByBiz.set(owner.business_id as string, emailById.get(owner.id) ?? "—");
    }
  }

  const result: TransferClaimRow[] = [];
  for (const row of rows) {
    const biz = bizMap.get(row.business_id as string);
    const receiptUrl = await signedReceiptUrl(String(row.receipt_path));
    result.push({
      id: row.id as string,
      businessId: row.business_id as string,
      businessName: String(biz?.name ?? "Negocio"),
      businessSlug: String(biz?.slug ?? ""),
      ownerEmail: ownerEmailByBiz.get(row.business_id as string) ?? "—",
      amountArs: row.amount_ars == null ? null : Number(row.amount_ars),
      currency: String(row.currency ?? "ARS"),
      receiptPath: String(row.receipt_path),
      receiptMime: (row.receipt_mime as string | null) ?? null,
      status: row.status as TransferClaimStatus,
      note: (row.note as string | null) ?? null,
      createdAt: String(row.created),
      reviewedAt: (row.reviewed_at as string | null) ?? null,
      receiptUrl,
    });
  }

  return result;
}

export async function approveTransferClaim(input: {
  claimId: string;
  reviewerId: string;
}) {
  const client = createAdminClient();
  const { data: claim, error } = await client
    .from("billing_transfer_claims")
    .select("id, business_id, status")
    .eq("id", input.claimId)
    .single();

  if (error || !claim) throw new Error("Comprobante no encontrado");
  if (claim.status !== "pending") throw new Error("Este comprobante ya fue revisado");

  const reviewedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await client
    .from("billing_transfer_claims")
    .update({
      status: "approved",
      reviewed_by: input.reviewerId,
      reviewed_at: reviewedAt,
      updated: reviewedAt,
      note: `Activado · plan USD ${SUBSCRIPTION_USD_PRICE}`,
    })
    .eq("id", input.claimId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updated) throw new Error("Este comprobante ya fue revisado");

  await activateSupabaseSubscription(claim.business_id as string);
}

export async function rejectTransferClaim(input: {
  claimId: string;
  reviewerId: string;
  note?: string;
}) {
  const client = createAdminClient();
  const { data: claim, error } = await client
    .from("billing_transfer_claims")
    .select("id, status")
    .eq("id", input.claimId)
    .single();

  if (error || !claim) throw new Error("Comprobante no encontrado");
  if (claim.status !== "pending") throw new Error("Este comprobante ya fue revisado");

  const reviewedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await client
    .from("billing_transfer_claims")
    .update({
      status: "rejected",
      reviewed_by: input.reviewerId,
      reviewed_at: reviewedAt,
      updated: reviewedAt,
      note: input.note?.trim() || "Comprobante rechazado",
    })
    .eq("id", input.claimId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updated) throw new Error("Este comprobante ya fue revisado");
}
