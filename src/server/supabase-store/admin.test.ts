import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("./helpers", () => ({
  getBusinessByIdWithClient: vi.fn(),
}));

import {
  getSupabaseAdminBookingsData,
  getSupabaseAdminCustomersData,
} from "./admin";

function createChainMock(finalData: unknown) {
  const calls: Record<string, unknown[]> = {};
  const record = (name: string, args: unknown[]) => {
    calls[name] = calls[name] ?? [];
    calls[name].push(args);
  };

  const builder = {
    calls,
    select: vi.fn((...args: unknown[]) => {
      record("select", args);
      return builder;
    }),
    eq: vi.fn((...args: unknown[]) => {
      record("eq", args);
      return builder;
    }),
    in: vi.fn((...args: unknown[]) => {
      record("in", args);
      return builder;
    }),
    order: vi.fn((...args: unknown[]) => {
      record("order", args);
      return builder;
    }),
    range: vi.fn((from: number, to: number) => {
      record("range", [from, to]);
      const items = Array.isArray(finalData) ? finalData.slice(from, to + 1) : finalData;
      return Promise.resolve({ data: items, error: null });
    }),
    then(resolve: (value: unknown) => unknown) {
      return Promise.resolve({ data: finalData, error: null }).then(resolve);
    },
  };

  return builder;
}

function createMockClient(tables: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => createChainMock(tables[table])),
  };
}

describe("getSupabaseAdminBookingsData pagination", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("applies default server-side pagination (page=1, limit=100)", async () => {
    const mockClient = createMockClient({ bookings: [] });
    createServerClientMock.mockResolvedValue(mockClient);

    await getSupabaseAdminBookingsData("biz-1");

    expect(mockClient.from).toHaveBeenCalledWith("bookings");
    const chain = mockClient.from.mock.results[0]?.value as ReturnType<typeof createChainMock>;
    expect(chain.range).toHaveBeenCalledWith(0, 99);
  });

  it("applies custom page and limit", async () => {
    const mockClient = createMockClient({ bookings: [] });
    createServerClientMock.mockResolvedValue(mockClient);

    await getSupabaseAdminBookingsData("biz-1", {}, { page: 3, limit: 25 });

    const chain = mockClient.from.mock.results[0]?.value as ReturnType<typeof createChainMock>;
    expect(chain.range).toHaveBeenCalledWith(50, 74);
  });
});

describe("getSupabaseAdminCustomersData pagination", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("applies default server-side pagination and filters bookings by returned customer ids", async () => {
    const mockClient = createMockClient({
      customers: [
        { id: "cust-1", fullName: "Ana", phone: "111", email: "ana@test.com", notes: "", created: "2026-01-01" },
        { id: "cust-2", fullName: "Bruno", phone: "222", email: "bruno@test.com", notes: "", created: "2026-01-02" },
      ],
      bookings: [],
    });
    createServerClientMock.mockResolvedValue(mockClient);

    await getSupabaseAdminCustomersData("biz-1");

    const fromCalls = mockClient.from.mock.calls as [string][];
    expect(fromCalls.map((c) => c[0])).toEqual(["customers", "bookings"]);

    const customersChain = mockClient.from.mock.results[0]?.value as ReturnType<typeof createChainMock>;
    expect(customersChain.range).toHaveBeenCalledWith(0, 99);

    const bookingsChain = mockClient.from.mock.results[1]?.value as ReturnType<typeof createChainMock>;
    expect(bookingsChain.in).toHaveBeenCalledWith("customer_id", ["cust-1", "cust-2"]);
  });

  it("does not query bookings when no customers are returned", async () => {
    const mockClient = createMockClient({
      customers: [],
      bookings: [],
    });
    createServerClientMock.mockResolvedValue(mockClient);

    await getSupabaseAdminCustomersData("biz-1");

    const fromCalls = mockClient.from.mock.calls as [string][];
    expect(fromCalls.map((c) => c[0])).toEqual(["customers"]);
  });
});
