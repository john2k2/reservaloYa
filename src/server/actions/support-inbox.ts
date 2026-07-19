"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import {
  addStaffSupportMessage,
  addVisitorSupportMessage,
  createSupportThread,
  setSupportThreadStatus,
  type SupportThreadSource,
} from "@/server/support-inbox";

const CONTACT_LIMIT_MAX = 5;
const CONTACT_LIMIT_WINDOW_MS = 60_000;

const createThreadSchema = z.object({
  visitorName: z.string().trim().min(2).max(120),
  visitorEmail: z.string().trim().email().max(200),
  visitorPhone: z.union([z.string().trim().min(6).max(30), z.literal("")]).optional(),
  body: z.string().trim().min(10).max(4000),
  source: z.enum(["contacto", "pricing", "other"]).optional(),
});

const replySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type SupportInboxActionResult =
  | { ok: true; accessToken?: string }
  | { ok: false; error: string };

async function enforceContactRateLimit(email: string) {
  const requestHeaders = await headers();
  const clientId = getRateLimitIdentifier(requestHeaders, "public-support");

  await assertRateLimit({
    bucket: "public-support",
    identifier: `${clientId}:${email.toLowerCase()}`,
    max: CONTACT_LIMIT_MAX,
    windowMs: CONTACT_LIMIT_WINDOW_MS,
    message: "Demasiadas consultas. Esperá unos segundos e intentá de nuevo.",
  });
}

export async function createSupportThreadAction(
  formData: FormData
): Promise<SupportInboxActionResult> {
  const raw = {
    visitorName: String(formData.get("visitorName") ?? ""),
    visitorEmail: String(formData.get("visitorEmail") ?? ""),
    visitorPhone: String(formData.get("visitorPhone") ?? ""),
    body: String(formData.get("body") ?? ""),
    source: String(formData.get("source") ?? "contacto"),
  };

  const parsed = createThreadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Revisá nombre, email y mensaje (mínimo 10 caracteres)." };
  }

  try {
    await enforceContactRateLimit(parsed.data.visitorEmail);
    const { accessToken } = await createSupportThread({
      visitorName: parsed.data.visitorName,
      visitorEmail: parsed.data.visitorEmail,
      visitorPhone: parsed.data.visitorPhone || null,
      body: parsed.data.body,
      source: (parsed.data.source ?? "contacto") as SupportThreadSource,
    });
    revalidatePath("/platform/consultas");
    return { ok: true, accessToken };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        ok: false,
        error: `${err.message} Reintentá en ${err.retryAfterSeconds}s.`,
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo enviar la consulta.",
    };
  }
}

export async function replyAsVisitorAction(
  accessToken: string,
  formData: FormData
): Promise<SupportInboxActionResult> {
  const parsed = replySchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) {
    return { ok: false, error: "Escribí un mensaje antes de enviar." };
  }

  try {
    await enforceContactRateLimit(accessToken);
    await addVisitorSupportMessage({
      accessToken,
      body: parsed.data.body,
    });
    revalidatePath(`/consulta/${accessToken}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        ok: false,
        error: `${err.message} Reintentá en ${err.retryAfterSeconds}s.`,
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
    };
  }
}

export async function replyAsStaffAction(
  threadId: string,
  formData: FormData
): Promise<SupportInboxActionResult> {
  const admin = await getAuthenticatedPlatformAdmin();
  if (!admin) {
    return { ok: false, error: "No autorizado." };
  }

  const parsed = replySchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) {
    return { ok: false, error: "Escribí una respuesta antes de enviar." };
  }

  try {
    await addStaffSupportMessage({
      threadId,
      body: parsed.data.body,
      staffUserId: admin.id,
    });
    revalidatePath("/platform/consultas");
    revalidatePath(`/platform/consultas/${threadId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo enviar la respuesta.",
    };
  }
}

export async function closeSupportThreadAction(
  threadId: string
): Promise<SupportInboxActionResult> {
  const admin = await getAuthenticatedPlatformAdmin();
  if (!admin) {
    return { ok: false, error: "No autorizado." };
  }

  try {
    await setSupportThreadStatus({ threadId, status: "closed" });
    revalidatePath("/platform/consultas");
    revalidatePath(`/platform/consultas/${threadId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo cerrar la consulta.",
    };
  }
}

export async function reopenSupportThreadAction(
  threadId: string
): Promise<SupportInboxActionResult> {
  const admin = await getAuthenticatedPlatformAdmin();
  if (!admin) {
    return { ok: false, error: "No autorizado." };
  }

  try {
    await setSupportThreadStatus({ threadId, status: "open" });
    revalidatePath("/platform/consultas");
    revalidatePath(`/platform/consultas/${threadId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo reabrir la consulta.",
    };
  }
}
