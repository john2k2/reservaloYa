import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, generateLinkMock, listUsersMock, singleMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  generateLinkMock: vi.fn(),
  listUsersMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
}));

function createFromMock() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: singleMock,
  };
}

describe("generateImpersonationLink", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://reservaya.ar");
    singleMock.mockResolvedValue({ data: { id: "user_123" } });
    listUsersMock.mockResolvedValue({ data: { users: [{ id: "user_123", email: "demo@reservaya.ar" }] } });
    generateLinkMock.mockResolvedValue({ data: { properties: { action_link: "https://supabase.test/magic" } } });
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => createFromMock()),
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

  it("configura redirectTo hacia el callback que persiste la sesion", async () => {
    const { generateImpersonationLink } = await import("./platform");

    await expect(generateImpersonationLink("biz_123")).resolves.toBe("https://supabase.test/magic");
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "magiclink",
      email: "demo@reservaya.ar",
      options: {
        redirectTo: "https://reservaya.ar/auth/callback?next=%2Fadmin%2Fdashboard",
      },
    });
  });
});
