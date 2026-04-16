import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const putMock = vi.fn(async () => ({
  pathname: "backups/pb/auto-2026-01-01.zip-random",
  access: "private",
}));
const listMock = vi.fn(async () => ({
  blobs: [
    {
      pathname: "backups/pb/old-backup.zip",
      uploadedAt: "2020-01-01T00:00:00.000Z",
    },
  ],
}));
const delMock = vi.fn(async () => undefined);
const authWithPasswordMock = vi.fn(async () => undefined);
const createBackupMock = vi.fn(async () => undefined);
const getTokenMock = vi.fn(async () => "file-token");
const deleteBackupMock = vi.fn(async () => undefined);

vi.mock("@vercel/blob", () => ({
  put: putMock,
  list: listMock,
  del: delMock,
}));

vi.mock("pocketbase", () => ({
  default: class PocketBase {
    collection(name: string) {
      if (name === "_superusers") {
        return { authWithPassword: authWithPasswordMock };
      }

      throw new Error(`Unexpected collection ${name}`);
    }

    backups = {
      create: createBackupMock,
      delete: deleteBackupMock,
    };

    files = {
      getToken: getTokenMock,
    };
  },
}));

describe("runBackup", () => {
  const originalEnv = {
    NEXT_PUBLIC_POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
    POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "https://pb.example.com";
    process.env.POCKETBASE_ADMIN_EMAIL = "admin@example.com";
    process.env.POCKETBASE_ADMIN_PASSWORD = "secret";
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";

    putMock.mockClear();
    listMock.mockClear();
    delMock.mockClear();
    authWithPasswordMock.mockClear();
    createBackupMock.mockClear();
    getTokenMock.mockClear();
    deleteBackupMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "application/zip" },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key as keyof typeof originalEnv];
      } else {
        process.env[key as keyof typeof originalEnv] = value;
      }
    }
  });

  it("sube backups privados y devuelve metadata no pública", async () => {
    const { runBackup } = await import("./pb-backup");

    await expect(runBackup()).resolves.toEqual({
      backupPath: "backups/pb/auto-2026-01-01.zip-random",
      size: 3,
      purged: 1,
      access: "private",
    });

    expect(putMock).toHaveBeenCalledWith(
      expect.stringMatching(/^backups\/pb\/auto-/),
      expect.any(Buffer),
      expect.objectContaining({
        access: "private",
        addRandomSuffix: true,
        token: "blob-token",
      })
    );
    expect(delMock).toHaveBeenCalledWith("backups/pb/old-backup.zip", {
      token: "blob-token",
    });
  });
});
