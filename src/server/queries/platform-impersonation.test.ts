import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, generateLinkMock, listUsersMock, singleMock, insertMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  generateLinkMock: vi.fn(),
  listUsersMock: vi.fn(),
  singleMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
}));

function createFromMock(table: string) {
  if (table === "impersonation_tokens") {
    return { insert: insertMock };
  }

  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: singleMock,
  };
}

describe("generateImpersonationToken", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://reservaya.ar");
    singleMock.mockResolvedValue({ data: { id: "user_123" } });
    listUsersMock.mockResolvedValue({ data: { users: [{ id: "user_123", email: "demo@reservaya.ar" }] } });
    generateLinkMock.mockResolvedValue({ data: { properties: { action_link: "https://supabase.test/magic" } } });
    insertMock.mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => createFromMock(table)),
      auth: {
        admin: {
          listUsers: listUsersMock,
          generateLink: generateLinkMock,
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("configura redirectTo hacia el callback que persiste la sesion, y devuelve un token en vez del link real", async () => {
    const { generateImpersonationToken } = await import("./platform");

    const token = await generateImpersonationToken("biz_123");

    expect(token).not.toBe("https://supabase.test/magic");
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "magiclink",
      email: "demo@reservaya.ar",
      options: {
        redirectTo: "https://reservaya.ar/auth/callback?next=%2Fadmin%2Fdashboard",
      },
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ token, magic_link: "https://supabase.test/magic" })
    );
  });
});
