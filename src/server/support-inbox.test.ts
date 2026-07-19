import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const {
  threadsStore,
  messagesStore,
  createAdminClientMock,
} = vi.hoisted(() => {
  type Thread = Record<string, unknown>;
  type Message = Record<string, unknown>;

  const threadsStore: Thread[] = [];
  const messagesStore: Message[] = [];

  function makeSelectBuilder(table: "support_threads" | "support_messages") {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    let orderAsc = true;
    let limitN: number | null = null;
    let countOnly = false;

    const api = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.head) countOnly = true;
        return api;
      },
      eq(col: string, value: unknown) {
        filters.push((row) => row[col] === value);
        return api;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderAsc = opts?.ascending !== false;
        void col;
        return api;
      },
      limit(n: number) {
        limitN = n;
        return api;
      },
      async maybeSingle() {
        const rows = apply();
        return { data: rows[0] ?? null, error: null };
      },
      async single() {
        const rows = apply();
        if (!rows[0]) return { data: null, error: { message: "not found" } };
        return { data: rows[0], error: null };
      },
      then(resolve: (value: { data: unknown; error: null; count?: number }) => void) {
        const rows = apply();
        if (countOnly) {
          resolve({ data: null, error: null, count: rows.length });
          return;
        }
        resolve({ data: rows, error: null });
      },
    };

    function apply() {
      const source = table === "support_threads" ? threadsStore : messagesStore;
      let rows = source.filter((row) => filters.every((fn) => fn(row)));
      rows = [...rows].sort((a, b) => {
        const av = String(a.created ?? a.last_message_at ?? "");
        const bv = String(b.created ?? b.last_message_at ?? "");
        return orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      if (limitN != null) rows = rows.slice(0, limitN);
      return rows;
    }

    return api;
  }

  function makeUpdateBuilder(table: "support_threads") {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    let patch: Record<string, unknown> = {};

    const api = {
      update(values: Record<string, unknown>) {
        patch = values;
        return api;
      },
      eq(col: string, value: unknown) {
        filters.push((row) => row[col] === value);
        return api;
      },
      async select() {
        return api;
      },
      async maybeSingle() {
        const store = threadsStore;
        const row = store.find((r) => filters.every((fn) => fn(r)));
        if (!row) return { data: null, error: null };
        Object.assign(row, patch);
        return { data: row, error: null };
      },
      then(resolve: (value: { data: null; error: null }) => void) {
        const store = table === "support_threads" ? threadsStore : [];
        for (const row of store) {
          if (filters.every((fn) => fn(row))) Object.assign(row, patch);
        }
        resolve({ data: null, error: null });
      },
    };
    return api;
  }

  const createAdminClientMock = vi.fn(() => ({
    from(table: string) {
      if (table === "support_threads") {
        return {
          insert(values: Record<string, unknown>) {
            const row = { id: values.id ?? `thread-${threadsStore.length + 1}`, ...values };
            threadsStore.push(row);
            return {
              select() {
                return {
                  async single() {
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
          select: (...args: unknown[]) =>
            makeSelectBuilder("support_threads").select(
              ...(args as [string?, { count?: string; head?: boolean }?])
            ),
          update: (values: Record<string, unknown>) =>
            makeUpdateBuilder("support_threads").update(values),
          delete() {
            return {
              eq(col: string, value: unknown) {
                const idx = threadsStore.findIndex((r) => r[col] === value);
                if (idx >= 0) threadsStore.splice(idx, 1);
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      if (table === "support_messages") {
        return {
          insert(values: Record<string, unknown>) {
            const row = { id: values.id ?? `msg-${messagesStore.length + 1}`, ...values };
            messagesStore.push(row);
            return {
              select() {
                return {
                  async single() {
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
          select: (...args: unknown[]) =>
            makeSelectBuilder("support_messages").select(
              ...(args as [string?, { count?: string; head?: boolean }?])
            ),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }));

  return { threadsStore, messagesStore, createAdminClientMock };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/runtime", () => ({
  getPublicAppUrl: () => "https://reservaya.ar",
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.50" })),
}));

vi.mock("@/server/platform-auth", () => ({
  getAuthenticatedPlatformAdmin: vi.fn(async () => ({
    id: "staff-1",
    email: "ortiz.jonathan2k@gmail.com",
  })),
}));

describe("support-inbox", () => {
  beforeEach(() => {
    threadsStore.length = 0;
    messagesStore.length = 0;
    resetRateLimitStoreForTests();
    vi.clearAllMocks();
    vi.stubEnv("PLATFORM_SUPERADMIN_EMAIL", "ortiz.jonathan2k@gmail.com");
    vi.unstubAllEnvs();
    vi.stubEnv("PLATFORM_SUPERADMIN_EMAIL", "ortiz.jonathan2k@gmail.com");
  });

  it("crea hilo con needsReply=true y accessToken", async () => {
    const { createSupportThread, getSupportThreadByToken } = await import(
      "@/server/support-inbox"
    );

    const { thread, accessToken } = await createSupportThread({
      visitorName: "Ana Pérez",
      visitorEmail: "ana@example.com",
      body: "Quiero probar ReservaYa para mi peluquería.",
    });

    expect(thread.needsReply).toBe(true);
    expect(thread.status).toBe("open");
    expect(accessToken).toBeTruthy();
    expect(messagesStore).toHaveLength(1);
    expect(messagesStore[0]?.author).toBe("visitor");

    const byToken = await getSupportThreadByToken(accessToken);
    expect(byToken?.id).toBe(thread.id);
  });

  it("staff reply marca needsReply=false; visitor reply lo vuelve a true", async () => {
    const {
      createSupportThread,
      addStaffSupportMessage,
      addVisitorSupportMessage,
      getSupportThreadById,
    } = await import("@/server/support-inbox");

    const { thread, accessToken } = await createSupportThread({
      visitorName: "Luis",
      visitorEmail: "luis@example.com",
      body: "Hola, ¿tienen demo?",
    });

    await addStaffSupportMessage({
      threadId: thread.id,
      body: "Sí, te paso la demo.",
      staffUserId: "staff-1",
    });

    let current = await getSupportThreadById(thread.id);
    expect(current?.needsReply).toBe(false);
    expect(messagesStore).toHaveLength(2);

    await addVisitorSupportMessage({
      accessToken,
      body: "Perfecto, ¿cuándo puedo verla?",
    });

    current = await getSupportThreadById(thread.id);
    expect(current?.needsReply).toBe(true);
    expect(messagesStore).toHaveLength(3);
  });

  it("lista filtra sin responder vs respondidas", async () => {
    const {
      createSupportThread,
      addStaffSupportMessage,
      listSupportThreads,
    } = await import("@/server/support-inbox");

    const a = await createSupportThread({
      visitorName: "A",
      visitorEmail: "a@example.com",
      body: "Mensaje A con más de diez.",
    });
    const b = await createSupportThread({
      visitorName: "B",
      visitorEmail: "b@example.com",
      body: "Mensaje B con más de diez.",
    });

    await addStaffSupportMessage({
      threadId: a.thread.id,
      body: "Respondido A",
      staffUserId: "staff-1",
    });

    const needsReply = await listSupportThreads("needs_reply");
    const answered = await listSupportThreads("answered");

    expect(needsReply.map((t) => t.id)).toContain(b.thread.id);
    expect(needsReply.map((t) => t.id)).not.toContain(a.thread.id);
    expect(answered.map((t) => t.id)).toContain(a.thread.id);
  });

  it("action de staff rechaza sin auth", async () => {
    const platformAuth = await import("@/server/platform-auth");
    vi.mocked(platformAuth.getAuthenticatedPlatformAdmin).mockResolvedValueOnce(null);

    const { replyAsStaffAction } = await import("@/server/actions/support-inbox");
    const formData = new FormData();
    formData.set("body", "Hola");
    const result = await replyAsStaffAction("thread-x", formData);
    expect(result).toEqual({ ok: false, error: "No autorizado." });
  });

  it("createSupportThreadAction valida input corto", async () => {
    const { createSupportThreadAction } = await import("@/server/actions/support-inbox");
    const formData = new FormData();
    formData.set("visitorName", "A");
    formData.set("visitorEmail", "bad");
    formData.set("body", "corto");
    const result = await createSupportThreadAction(formData);
    expect(result.ok).toBe(false);
  });
});
