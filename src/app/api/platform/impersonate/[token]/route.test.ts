import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedPlatformAdminMock, resolveImpersonationTokenMock } = vi.hoisted(() => ({
  getAuthenticatedPlatformAdminMock: vi.fn(),
  resolveImpersonationTokenMock: vi.fn(),
}));

vi.mock("@/server/platform-auth", () => ({
  getAuthenticatedPlatformAdmin: getAuthenticatedPlatformAdminMock,
}));

vi.mock("@/server/queries/platform", () => ({
  resolveImpersonationToken: resolveImpersonationTokenMock,
}));

import { GET } from "./route";

function buildParams(token: string) {
  return { params: Promise.resolve({ token }) };
}

describe("GET /api/platform/impersonate/[token]", () => {
  beforeEach(() => {
    getAuthenticatedPlatformAdminMock.mockReset();
    resolveImpersonationTokenMock.mockReset();
  });

  it("rejects requests without an authenticated platform superadmin", async () => {
    getAuthenticatedPlatformAdminMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/platform/impersonate/tok-1"), buildParams("tok-1"));

    expect(response.status).toBe(401);
    expect(resolveImpersonationTokenMock).not.toHaveBeenCalled();
  });

  it("redirects to the resolved magic link for a valid token", async () => {
    getAuthenticatedPlatformAdminMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
    resolveImpersonationTokenMock.mockResolvedValue("https://supabase.example/auth/magiclink?token=real");

    const response = await GET(new Request("http://localhost/api/platform/impersonate/tok-1"), buildParams("tok-1"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://supabase.example/auth/magiclink?token=real");
  });

  it("returns 410 for a missing, expired, or already-used token without leaking details", async () => {
    getAuthenticatedPlatformAdminMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
    resolveImpersonationTokenMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/platform/impersonate/tok-bad"), buildParams("tok-bad"));

    expect(response.status).toBe(410);
  });
});
