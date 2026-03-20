import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createPocketBaseClientMock,
  getPocketBasePublicAuthEmailMock,
  getPocketBasePublicAuthPasswordMock,
  hasPocketBasePublicAuthCredentialsMock,
} = vi.hoisted(() => ({
  createPocketBaseClientMock: vi.fn(),
  getPocketBasePublicAuthEmailMock: vi.fn(() => "public@app.test"),
  getPocketBasePublicAuthPasswordMock: vi.fn(() => "secret123"),
  hasPocketBasePublicAuthCredentialsMock: vi.fn(() => false),
}));

vi.mock("@/lib/pocketbase/shared", () => ({
  createPocketBaseClient: createPocketBaseClientMock,
}));

vi.mock("@/lib/pocketbase/config", () => ({
  getPocketBasePublicAuthEmail: getPocketBasePublicAuthEmailMock,
  getPocketBasePublicAuthPassword: getPocketBasePublicAuthPasswordMock,
  hasPocketBasePublicAuthCredentials: hasPocketBasePublicAuthCredentialsMock,
}));

describe("createPocketBasePublicClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createPocketBaseClientMock.mockReset();
    getPocketBasePublicAuthEmailMock.mockReturnValue("public@app.test");
    getPocketBasePublicAuthPasswordMock.mockReturnValue("secret123");
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(false);
  });

  it("throws when public credentials are missing", async () => {
    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).rejects.toThrow(
      "PocketBase public credentials are required"
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
  });

  it("rethrows authentication errors with context", async () => {
    hasPocketBasePublicAuthCredentialsMock.mockReturnValue(true);
    createPocketBaseClientMock.mockReturnValue({
      collection: vi.fn(() => ({
        authWithPassword: vi.fn(async () => {
          throw new Error("invalid credentials");
        }),
      })),
    });

    const { createPocketBasePublicClient } = await import("./public");

    await expect(createPocketBasePublicClient()).rejects.toThrow("invalid credentials");
  });
});
