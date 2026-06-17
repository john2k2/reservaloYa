import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.fn();

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
  updateSupabaseRecord: vi.fn(),
}));

vi.mock("@/server/mp-token-crypto", () => ({
  decryptMPToken: vi.fn((value: string | null | undefined) =>
    value ? `decrypted:${value}` : value
  ),
  encryptMPToken: vi.fn((value: string) => `encrypted:${value}`),
}));

describe("getSupabaseBusinessPaymentSettingsByCollectorId", () => {
  beforeEach(() => {
    vi.resetModules();
    getSupabaseAdminClientMock.mockReset();
  });

  function buildMockClient(data: unknown | null) {
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve(
                data ? { data, error: null } : { data: null, error: { message: "not found" } }
              )
            ),
          })),
        })),
      })),
    };
  }

  it("returns null when no business matches the collector id", async () => {
    getSupabaseAdminClientMock.mockResolvedValue(buildMockClient(null));

    const { getSupabaseBusinessPaymentSettingsByCollectorId } = await import("./payments");

    await expect(
      getSupabaseBusinessPaymentSettingsByCollectorId("collector-1")
    ).resolves.toBeNull();
  });

  it("returns decrypted tokens and expiration for a matching business", async () => {
    const business = {
      id: "biz-1",
      slug: "demo-barberia",
      name: "Demo Barberia",
      mpConnected: true,
      mpCollectorId: "collector-1",
      mpAccessToken: "encrypted-access-token",
      mpRefreshToken: "encrypted-refresh-token",
      mpTokenExpiresAt: "2026-01-01T00:00:00Z",
    };

    getSupabaseAdminClientMock.mockResolvedValue(buildMockClient(business));

    const { getSupabaseBusinessPaymentSettingsByCollectorId } = await import("./payments");

    const result = await getSupabaseBusinessPaymentSettingsByCollectorId("collector-1");

    expect(result).toEqual({
      businessId: "biz-1",
      businessSlug: "demo-barberia",
      businessName: "Demo Barberia",
      mpConnected: true,
      mpCollectorId: "collector-1",
      mpAccessToken: "decrypted:encrypted-access-token",
      mpRefreshToken: "decrypted:encrypted-refresh-token",
      mpTokenExpiresAt: "2026-01-01T00:00:00Z",
    });
  });
});
