import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, listUsersMock, generateLinkMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  listUsersMock: vi.fn(),
  generateLinkMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
}));

import { generateImpersonationToken, resolveImpersonationToken } from "./platform";

type ImpersonationTokenRow = {
  token: string;
  magic_link: string;
  expires_at: string;
  used_at: string | null;
};

function createAppUsersBuilder(ownerId: string | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      ownerId ? { data: { id: ownerId }, error: null } : { data: null, error: { message: "not found" } }
    ),
  };
}

function createInsertBuilder(store: Map<string, ImpersonationTokenRow>) {
  return {
    insert: vi.fn((row: ImpersonationTokenRow) => {
      store.set(row.token, { ...row, used_at: null });
      return Promise.resolve({ error: null });
    }),
  };
}

function createSelectForResolveBuilder(store: Map<string, ImpersonationTokenRow>) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn((_col: string, token: string) => ({
        single: vi.fn(() => {
          const row = store.get(token);
          return Promise.resolve(row ? { data: row, error: null } : { data: null, error: { message: "not found" } });
        }),
      })),
    })),
    update: vi.fn((patch: { used_at: string }) => ({
      eq: vi.fn((_col: string, token: string) => ({
        is: vi.fn((_usedCol: string, _value: null) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const row = store.get(token);
              if (!row || row.used_at) {
                return Promise.resolve({ data: null, error: null });
              }
              row.used_at = patch.used_at;
              store.set(token, row);
              return Promise.resolve({ data: { magic_link: row.magic_link }, error: null });
            }),
          })),
        })),
      })),
    })),
  };
}

describe("generateImpersonationToken", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    listUsersMock.mockReset();
    generateLinkMock.mockReset();
  });

  it("never returns the raw magic link, only an opaque token", async () => {
    const store = new Map<string, ImpersonationTokenRow>();
    listUsersMock.mockResolvedValue({
      data: { users: [{ id: "owner-1", email: "owner@example.com" }] },
      error: null,
    });
    generateLinkMock.mockResolvedValue({
      data: { properties: { action_link: "https://supabase.example/auth/magiclink?token=real-secret" } },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "app_users") return createAppUsersBuilder("owner-1");
        if (table === "impersonation_tokens") return createInsertBuilder(store);
        throw new Error(`unexpected table ${table}`);
      }),
      auth: { admin: { listUsers: listUsersMock, generateLink: generateLinkMock } },
    });

    const token = await generateImpersonationToken("biz-1");

    expect(token).not.toContain("real-secret");
    expect(token).not.toContain("supabase.example");
    expect(store.get(token)?.magic_link).toBe(
      "https://supabase.example/auth/magiclink?token=real-secret"
    );
    expect(new Date(store.get(token)!.expires_at).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("resolveImpersonationToken", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
  });

  function setupWithStore(store: Map<string, ImpersonationTokenRow>) {
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "impersonation_tokens") return createSelectForResolveBuilder(store);
        throw new Error(`unexpected table ${table}`);
      }),
    });
  }

  it("resolves a valid, unused token to its magic link and marks it used", async () => {
    const store = new Map<string, ImpersonationTokenRow>([
      [
        "tok-1",
        {
          token: "tok-1",
          magic_link: "https://supabase.example/magic",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          used_at: null,
        },
      ],
    ]);
    setupWithStore(store);

    const link = await resolveImpersonationToken("tok-1");

    expect(link).toBe("https://supabase.example/magic");
    expect(store.get("tok-1")?.used_at).not.toBeNull();
  });

  it("rejects a missing token", async () => {
    setupWithStore(new Map());
    await expect(resolveImpersonationToken("nope")).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const store = new Map<string, ImpersonationTokenRow>([
      [
        "tok-expired",
        {
          token: "tok-expired",
          magic_link: "https://supabase.example/magic",
          expires_at: new Date(Date.now() - 1000).toISOString(),
          used_at: null,
        },
      ],
    ]);
    setupWithStore(store);

    await expect(resolveImpersonationToken("tok-expired")).resolves.toBeNull();
  });

  it("rejects a token that was already used", async () => {
    const store = new Map<string, ImpersonationTokenRow>([
      [
        "tok-used",
        {
          token: "tok-used",
          magic_link: "https://supabase.example/magic",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          used_at: new Date().toISOString(),
        },
      ],
    ]);
    setupWithStore(store);

    await expect(resolveImpersonationToken("tok-used")).resolves.toBeNull();
  });

  it("only lets one of two concurrent requests for the same token win", async () => {
    const store = new Map<string, ImpersonationTokenRow>([
      [
        "tok-race",
        {
          token: "tok-race",
          magic_link: "https://supabase.example/magic",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          used_at: null,
        },
      ],
    ]);
    setupWithStore(store);

    const [first, second] = await Promise.all([
      resolveImpersonationToken("tok-race"),
      resolveImpersonationToken("tok-race"),
    ]);

    const results = [first, second].filter((r) => r !== null);
    expect(results).toHaveLength(1);
  });
});
