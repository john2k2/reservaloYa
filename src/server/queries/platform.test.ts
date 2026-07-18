import { beforeEach, describe, expect, it, vi } from "vitest";

const createAdminClientMock = vi.hoisted(() => vi.fn());
const getBlueDollarRateMock = vi.hoisted(() => vi.fn());
const listUsersMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/dollar-rate", () => ({
  getBlueDollarRate: getBlueDollarRateMock,
}));

import { getPlatformBusinessesList, getPlatformUsersList } from "./platform";

function createThenableBuilder(tableData: unknown) {
  const calls: Record<string, unknown[]> = {};
  const record = (name: string, args: unknown[]) => {
    calls[name] = calls[name] ?? [];
    calls[name].push(args);
  };

  const builder: Record<string, unknown> & {
    range?: (from: number, to: number) => Promise<unknown>;
    in?: (column: string, values: unknown[]) => typeof builder;
    limit?: (count: number) => typeof builder;
    calls: Record<string, unknown[]>;
    then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  } = {
    calls,
    select: vi.fn((...args: unknown[]) => {
      record("select", args);
      return builder;
    }),
    eq: vi.fn((...args: unknown[]) => {
      record("eq", args);
      return builder;
    }),
    not: vi.fn((...args: unknown[]) => {
      record("not", args);
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
    gte: vi.fn((...args: unknown[]) => {
      record("gte", args);
      return builder;
    }),
    limit: vi.fn((...args: unknown[]) => {
      record("limit", args);
      return builder;
    }),
    range: vi.fn((from: number, to: number) => {
      record("range", [from, to]);
      const items = Array.isArray(tableData) ? tableData.slice(from, to + 1) : tableData;
      return Promise.resolve({ data: items, error: null });
    }),
    then(resolve: (value: unknown) => unknown) {
      return Promise.resolve({ data: tableData, error: null }).then(resolve);
    },
  };

  return builder;
}

function createMockClient(tables: Record<string, unknown>, users: unknown[] = []) {
  return {
    from: vi.fn((table: string) => createThenableBuilder(tables[table])),
    auth: {
      admin: {
        listUsers: listUsersMock.mockResolvedValue({ data: { users }, error: null }),
      },
    },
  };
}

describe("platform list queries pagination", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    getBlueDollarRateMock.mockReset();
    listUsersMock.mockReset();
    getBlueDollarRateMock.mockResolvedValue(1000);
  });

  it("getPlatformBusinessesList applies default pagination to businesses", async () => {
    createAdminClientMock.mockReturnValue(
      createMockClient({
        businesses: [],
        app_users: [],
        bookings: [],
        subscriptions: [],
        services: [],
        availability_rules: [],
        communication_events: [],
      })
    );

    await getPlatformBusinessesList();

    const client = createAdminClientMock.mock.results[0]?.value as ReturnType<typeof createMockClient>;
    expect(client.from.mock.calls[0]?.[0]).toBe("businesses");

    const chain = client.from.mock.results[0]?.value as ReturnType<typeof createThenableBuilder>;
    expect(chain.range).toHaveBeenCalledWith(0, 49);
  });

  it("getPlatformBusinessesList applies custom page and limit", async () => {
    createAdminClientMock.mockReturnValue(
      createMockClient({
        businesses: [],
        app_users: [],
        bookings: [],
        subscriptions: [],
        services: [],
        availability_rules: [],
        communication_events: [],
      })
    );

    await getPlatformBusinessesList({ page: 2, limit: 10 });

    const client = createAdminClientMock.mock.results[0]?.value as ReturnType<typeof createMockClient>;
    const chain = client.from.mock.results[0]?.value as ReturnType<typeof createThenableBuilder>;
    expect(chain.range).toHaveBeenCalledWith(10, 19);
  });

  it("getPlatformUsersList applies default pagination", async () => {
    createAdminClientMock.mockReturnValue(
      createMockClient(
        {
          app_users: [],
          businesses: [],
        },
        []
      )
    );

    await getPlatformUsersList();

    const client = createAdminClientMock.mock.results[0]?.value as ReturnType<typeof createMockClient>;
    expect(client.from.mock.calls[0]?.[0]).toBe("app_users");

    const chain = client.from.mock.results[0]?.value as ReturnType<typeof createThenableBuilder>;
    expect(chain.range).toHaveBeenCalledWith(0, 49);
  });
});
