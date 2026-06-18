import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClientMock,
  createPublicClientMock,
  createSessionClientMock,
  persistSupabaseAuthMock,
  clearSupabaseAuthMock,
  getSupabaseAuthTokenFromCookiesMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createPublicClientMock: vi.fn(),
  createSessionClientMock: vi.fn(),
  persistSupabaseAuthMock: vi.fn(),
  clearSupabaseAuthMock: vi.fn(),
  getSupabaseAuthTokenFromCookiesMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
  createPublicClient: createPublicClientMock,
  createSessionClient: createSessionClientMock,
  persistSupabaseAuth: persistSupabaseAuthMock,
  clearSupabaseAuth: clearSupabaseAuthMock,
  getSupabaseAuthTokenFromCookies: getSupabaseAuthTokenFromCookiesMock,
}));

function createMockAdminClient() {
  const authGetUserMock = vi.fn();
  const adminUpdateUserByIdMock = vi.fn();
  const adminSignOutMock = vi.fn();

  createAdminClientMock.mockReturnValue({
    auth: {
      getUser: authGetUserMock,
      admin: {
        updateUserById: adminUpdateUserByIdMock,
        signOut: adminSignOutMock,
      },
    },
  });

  return { authGetUserMock, adminUpdateUserByIdMock, adminSignOutMock };
}

describe("supabase-auth", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
    createPublicClientMock.mockReset();
    createSessionClientMock.mockReset();
    persistSupabaseAuthMock.mockReset();
    clearSupabaseAuthMock.mockReset();
    getSupabaseAuthTokenFromCookiesMock.mockReset();
  });

  describe("signOutSupabaseUser", () => {
    it("invalidates the Supabase session and clears the local cookie", async () => {
      getSupabaseAuthTokenFromCookiesMock.mockResolvedValue("token-123");
      const { authGetUserMock, adminSignOutMock } = createMockAdminClient();
      authGetUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      adminSignOutMock.mockResolvedValue({ error: null });

      const { signOutSupabaseUser } = await import("./supabase-auth");
      await signOutSupabaseUser();

      expect(getSupabaseAuthTokenFromCookiesMock).toHaveBeenCalled();
      expect(authGetUserMock).toHaveBeenCalledWith("token-123");
      expect(adminSignOutMock).toHaveBeenCalledWith("user-1");
      expect(clearSupabaseAuthMock).toHaveBeenCalled();
    });

    it("still clears the local cookie when session invalidation fails", async () => {
      getSupabaseAuthTokenFromCookiesMock.mockResolvedValue("token-123");
      const { authGetUserMock, adminSignOutMock } = createMockAdminClient();
      authGetUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      adminSignOutMock.mockRejectedValue(new Error("Supabase error"));

      const { signOutSupabaseUser } = await import("./supabase-auth");
      await expect(signOutSupabaseUser()).resolves.not.toThrow();

      expect(adminSignOutMock).toHaveBeenCalledWith("user-1");
      expect(clearSupabaseAuthMock).toHaveBeenCalled();
    });
  });

  describe("updateSupabaseUserPassword", () => {
    it("updates the password and revokes existing sessions", async () => {
      const { authGetUserMock, adminUpdateUserByIdMock, adminSignOutMock } = createMockAdminClient();
      authGetUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      adminUpdateUserByIdMock.mockResolvedValue({ error: null });
      adminSignOutMock.mockResolvedValue({ error: null });

      const { updateSupabaseUserPassword } = await import("./supabase-auth");
      await updateSupabaseUserPassword("reset-token", "NewPassword123");

      expect(authGetUserMock).toHaveBeenCalledWith("reset-token");
      expect(adminUpdateUserByIdMock).toHaveBeenCalledWith("user-1", { password: "NewPassword123" });
      expect(adminSignOutMock).toHaveBeenCalledWith("user-1");
    });

    it("throws when session invalidation fails after password update", async () => {
      const { authGetUserMock, adminUpdateUserByIdMock, adminSignOutMock } = createMockAdminClient();
      authGetUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      adminUpdateUserByIdMock.mockResolvedValue({ error: null });
      adminSignOutMock.mockRejectedValue(new Error("Supabase session error"));

      const { updateSupabaseUserPassword } = await import("./supabase-auth");
      await expect(updateSupabaseUserPassword("reset-token", "NewPassword123")).rejects.toThrow(
        "no se pudieron invalidar las sesiones activas"
      );

      expect(adminUpdateUserByIdMock).toHaveBeenCalledWith("user-1", { password: "NewPassword123" });
      expect(adminSignOutMock).toHaveBeenCalledWith("user-1");
    });
  });
});
