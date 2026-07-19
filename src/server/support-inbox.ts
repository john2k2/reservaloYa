import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/server";
import { getPublicAppUrl } from "@/lib/runtime";
import { siteContact } from "@/lib/contact";
import { createLogger } from "@/server/logger";
import { emailBase, escapeHtml } from "@/server/email-templates";
import { timeoutSignal } from "@/lib/fetch-with-timeout";

const logger = createLogger("Support Inbox");

export type SupportThreadStatus = "open" | "closed";
export type SupportMessageAuthor = "visitor" | "staff" | "system" | "ai";
export type SupportThreadSource = "contacto" | "pricing" | "other";
export type SupportThreadFilter = "all" | "needs_reply" | "answered" | "closed";

export type SupportThread = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  source: SupportThreadSource;
  subject: string;
  status: SupportThreadStatus;
  needsReply: boolean;
  lastMessageAt: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  author: SupportMessageAuthor;
  body: string;
  staffUserId: string | null;
  createdAt: string;
};

type ThreadRow = {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  source: string;
  subject: string;
  status: string;
  needs_reply: boolean;
  last_message_at: string;
  access_token: string;
  created: string;
  updated: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  author: string;
  body: string;
  staff_user_id: string | null;
  created: string;
};

function mapThread(row: ThreadRow): SupportThread {
  return {
    id: row.id,
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email,
    visitorPhone: row.visitor_phone,
    source: row.source as SupportThreadSource,
    subject: row.subject,
    status: row.status as SupportThreadStatus,
    needsReply: row.needs_reply,
    lastMessageAt: row.last_message_at,
    accessToken: row.access_token,
    createdAt: row.created,
    updatedAt: row.updated,
  };
}

function mapMessage(row: MessageRow): SupportMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    author: row.author as SupportMessageAuthor,
    body: row.body,
    staffUserId: row.staff_user_id,
    createdAt: row.created,
  };
}

export function createSupportAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function buildSupportThreadUrl(accessToken: string) {
  return `${getPublicAppUrl()}/consulta/${accessToken}`;
}

export function buildPlatformThreadUrl(threadId: string) {
  return `${getPublicAppUrl()}/platform/consultas/${threadId}`;
}

function getOpsNotifyEmail() {
  return (
    process.env.PLATFORM_SUPERADMIN_EMAIL?.trim() ||
    siteContact.email
  ).toLowerCase();
}

function getFromEmail() {
  const configured = process.env.RESEND_FROM_EMAIL;
  const from = configured || "onboarding@resend.dev";
  return `ReservaYa <${from}>`;
}

async function sendResendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY missing; skip support inbox email", {
      to: payload.to,
      subject: payload.subject,
    });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
      signal: timeoutSignal(10_000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error("Support inbox email failed", {
        status: response.status,
        body: body.slice(0, 300),
      });
    }
  } catch (err) {
    logger.error("Support inbox email error", err);
  }
}

function buildStaffNotifyHtml(input: {
  visitorName: string;
  visitorEmail: string;
  preview: string;
  threadUrl: string;
  isNew: boolean;
}) {
  const title = input.isNew ? "Nueva consulta comercial" : "Nuevo mensaje en una consulta";
  return emailBase(
    title,
    `
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>${escapeHtml(input.visitorName)}</strong>
        (${escapeHtml(input.visitorEmail)})
      </p>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.preview)}</p>
      <a href="${escapeHtml(input.threadUrl)}" style="display:inline-block;background:#4b3a8f;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:600;">
        Abrir en el panel
      </a>
    `
  );
}

function buildVisitorNotifyHtml(input: {
  visitorName: string;
  preview: string;
  threadUrl: string;
}) {
  return emailBase(
    "Respuesta de ReservaYa",
    `
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Respondimos tu consulta</h1>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
        Hola ${escapeHtml(input.visitorName)},
      </p>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.preview)}</p>
      <a href="${escapeHtml(input.threadUrl)}" style="display:inline-block;background:#4b3a8f;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:600;">
        Ver y responder en la web
      </a>
      <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
        Guardá este link: es tu acceso privado a la conversación.
      </p>
    `
  );
}

export async function createSupportThread(input: {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string | null;
  body: string;
  source?: SupportThreadSource;
  subject?: string;
}) {
  const client = createAdminClient();
  const now = new Date().toISOString();
  const accessToken = createSupportAccessToken();

  const { data: threadRow, error: threadError } = await client
    .from("support_threads")
    .insert({
      visitor_name: input.visitorName,
      visitor_email: input.visitorEmail.toLowerCase().trim(),
      visitor_phone: input.visitorPhone?.trim() || null,
      source: input.source ?? "contacto",
      subject: input.subject?.trim() || "Consulta comercial",
      status: "open",
      needs_reply: true,
      last_message_at: now,
      access_token: accessToken,
      created: now,
      updated: now,
    })
    .select("*")
    .single();

  if (threadError || !threadRow) {
    throw new Error(threadError?.message ?? "No se pudo crear la consulta.");
  }

  const thread = mapThread(threadRow as ThreadRow);

  const { data: messageRow, error: messageError } = await client
    .from("support_messages")
    .insert({
      thread_id: thread.id,
      author: "visitor",
      body: input.body.trim(),
      created: now,
    })
    .select("*")
    .single();

  if (messageError || !messageRow) {
    await client.from("support_threads").delete().eq("id", thread.id);
    throw new Error(messageError?.message ?? "No se pudo guardar el mensaje.");
  }

  const message = mapMessage(messageRow as MessageRow);
  const platformUrl = buildPlatformThreadUrl(thread.id);

  void sendResendEmail({
    to: getOpsNotifyEmail(),
    subject: `Nueva consulta: ${thread.visitorName}`,
    html: buildStaffNotifyHtml({
      visitorName: thread.visitorName,
      visitorEmail: thread.visitorEmail,
      preview: message.body.slice(0, 400),
      threadUrl: platformUrl,
      isNew: true,
    }),
  });

  return { thread, message, accessToken: thread.accessToken };
}

export async function getSupportThreadByToken(accessToken: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("support_threads")
    .select("*")
    .eq("access_token", accessToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapThread(data as ThreadRow) : null;
}

export async function getSupportThreadById(threadId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("support_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapThread(data as ThreadRow) : null;
}

export async function listSupportMessages(threadId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export const SUPPORT_THREADS_PAGE_SIZE = 30;

export async function listSupportThreads(
  filter: SupportThreadFilter = "all",
  options: { offset?: number; limit?: number } = {}
) {
  const limit = options.limit ?? SUPPORT_THREADS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const client = createAdminClient();
  let query = client.from("support_threads").select("*").order("last_message_at", {
    ascending: false,
  });

  if (filter === "needs_reply") {
    query = query.eq("status", "open").eq("needs_reply", true);
  } else if (filter === "answered") {
    query = query.eq("status", "open").eq("needs_reply", false);
  } else if (filter === "closed") {
    query = query.eq("status", "closed");
  }

  // Pedimos un registro extra para saber si hay más páginas sin una query de count aparte.
  const { data, error } = await query.range(offset, offset + limit);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ThreadRow[];
  const hasMore = rows.length > limit;
  return { threads: rows.slice(0, limit).map(mapThread), hasMore };
}

export async function countSupportThreadsNeedingReply() {
  const client = createAdminClient();
  const { count, error } = await client
    .from("support_threads")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .eq("needs_reply", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function addVisitorSupportMessage(input: {
  accessToken: string;
  body: string;
}) {
  const thread = await getSupportThreadByToken(input.accessToken);
  if (!thread) {
    throw new Error("No encontramos esta consulta.");
  }
  if (thread.status === "closed") {
    throw new Error("Esta consulta está cerrada. Abrí una nueva desde Contacto.");
  }

  const client = createAdminClient();
  const now = new Date().toISOString();

  const { data: messageRow, error: messageError } = await client
    .from("support_messages")
    .insert({
      thread_id: thread.id,
      author: "visitor",
      body: input.body.trim(),
      created: now,
    })
    .select("*")
    .single();

  if (messageError || !messageRow) {
    throw new Error(messageError?.message ?? "No se pudo enviar el mensaje.");
  }

  const { error: updateError } = await client
    .from("support_threads")
    .update({
      needs_reply: true,
      last_message_at: now,
      updated: now,
      status: "open",
    })
    .eq("id", thread.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const message = mapMessage(messageRow as MessageRow);

  void sendResendEmail({
    to: getOpsNotifyEmail(),
    subject: `Nuevo mensaje: ${thread.visitorName}`,
    html: buildStaffNotifyHtml({
      visitorName: thread.visitorName,
      visitorEmail: thread.visitorEmail,
      preview: message.body.slice(0, 400),
      threadUrl: buildPlatformThreadUrl(thread.id),
      isNew: false,
    }),
  });

  return { thread: { ...thread, needsReply: true, lastMessageAt: now }, message };
}

export async function addStaffSupportMessage(input: {
  threadId: string;
  body: string;
  staffUserId: string;
}) {
  const thread = await getSupportThreadById(input.threadId);
  if (!thread) {
    throw new Error("Consulta no encontrada.");
  }

  const client = createAdminClient();
  const now = new Date().toISOString();

  const { data: messageRow, error: messageError } = await client
    .from("support_messages")
    .insert({
      thread_id: thread.id,
      author: "staff",
      body: input.body.trim(),
      staff_user_id: input.staffUserId,
      created: now,
    })
    .select("*")
    .single();

  if (messageError || !messageRow) {
    throw new Error(messageError?.message ?? "No se pudo enviar la respuesta.");
  }

  const { error: updateError } = await client
    .from("support_threads")
    .update({
      needs_reply: false,
      last_message_at: now,
      updated: now,
      status: "open",
    })
    .eq("id", thread.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const message = mapMessage(messageRow as MessageRow);
  const visitorUrl = buildSupportThreadUrl(thread.accessToken);

  void sendResendEmail({
    to: thread.visitorEmail,
    subject: "Respondimos tu consulta · ReservaYa",
    html: buildVisitorNotifyHtml({
      visitorName: thread.visitorName,
      preview: message.body.slice(0, 400),
      threadUrl: visitorUrl,
    }),
  });

  return {
    thread: { ...thread, needsReply: false, lastMessageAt: now, status: "open" as const },
    message,
  };
}

export async function setSupportThreadStatus(input: {
  threadId: string;
  status: SupportThreadStatus;
}) {
  const client = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("support_threads")
    .update({
      status: input.status,
      updated: now,
      ...(input.status === "closed" ? { needs_reply: false } : {}),
    })
    .eq("id", input.threadId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Consulta no encontrada.");
  return mapThread(data as ThreadRow);
}
