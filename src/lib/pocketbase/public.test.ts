import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createPocketBaseAdminClientMock,
  createPocketBaseClientMock,
  getPocketBasePublicAuthEmailMock,
  getPocketBasePublicAuthPasswordMock,
  hasPocketBasePublicAuthCredentialsMock,
  isProductionEnvironmentMock,
} = vi.hoisted(() => ({
  createPocketBaseAdminClientMock: vi.fn(),
  createPocketBaseClientMock: vi.fn(),
  getPocketBasePublicAuthEmailMock: vi.fn(() => "public@app.test"),
  getPocketBasePublicAuthPasswordMock: vi.fn(() => "secret123"),
  hasPocketBasePublicAuthCredentialsMock: vi.fn(() => false),
  isProductionEnvironmentMock: vi.fn(() => false),
}));

vi.mock("@/lib/pocketbase/admin", () => ({
  createPocketBaseAdminClient: createPocketBaseAdminClientMock,
}));

vi.mock("@/lib/pocketbase/shared", () => ({
  createPocketBaseClient: createPocketBaseClientMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  getPocketBasePublicAuthEmail: getPocketBasePublicAuthEmailMock,
  getPocketBasePublicAuthPassword: getPocketBasePublicAuthPasswordMock,
  hasPocketBasePublicAuthCredentials: hasPocketBasePublicAuthCredentialsMock,
}));

vi.mock("@/lib/runtime", () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

describe("createPocketBasePublicClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createPocketBaseAdminClientMock.mockReset();
    createPocketBaseClientMock.mockReset();
    getPocketBasePublicAuthEmailMock.mockReturnValue("public@app.test");
    getPocketBasePublicAuthPasswordMock.mockReturnValue("secret123");
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(false);
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it("falls back to admin in non-production when public credentials are missing", async () => {
    const adminClient = { source: "admin" };
    createPocketBaseAdminClientMock.mockResolvedValue(adminClient);

    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).resolves.toBe(adminClient);
    expect(createPocketBaseAdminClientMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed in production when public credentials are missing", async () => {
    isProductionEnvironmentMock.mockReturnValue(true);

    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).rejects.toThrow(
      "PocketBase public credentials are required in production"
    );
  });

  it("authenticates with the public technical user when credentials exist", async () => {
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(true);
    const authWithPasswordMock = vi.fn(async () => true);
    const publicClient = {
      collection: vi.fn(() => ({
        authWithPassword: authWithPasswordMock,
      })),
    };
    createPocketBaseClientMock.mockReturnValue(publicClient);

    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).resolves.toBe(publicClient);
    expect(authWithPasswordMock).toHaveBeenCalledWith("public@app.test", "secret123");
    expect(createPocketBaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("fails closed in production when public authentication breaks", async () => {
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(true);
    isProductionEnvironmentMock.mockReturnValue(true);
    createPocketBaseClientMock.mockReturnValue({
      collection: vi.fn(() => ({
        authWithPassword: vi.fn(async () => {
          throw new Error("invalid credentials");
        }),
      })),
    });

    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).rejects.toThrow(
      "PocketBase public credentials are configured but the public client could not authenticate."
    );
  });
});
