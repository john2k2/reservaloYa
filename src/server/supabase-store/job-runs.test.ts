import { describe, expect, it, vi } from "vitest";

const { getSupabaseAdminClientMock } = vi.hoisted(() => ({
  getSupabaseAdminClientMock: vi.fn(),
}));

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

import { startJobRun, finishJobRun } from "./job-runs";

function buildMockClient() {
  const inserted: Record<string, unknown>[] = [];
  const updates: Array<{ patch: Record<string, unknown>; eqId?: string }> = [];

  const from = vi.fn(() => {
    const chain: Record<string, unknown> = {};

    chain.insert = (row: Record<string, unknown>) => {
      inserted.push(row);
      return chain;
    };
    chain.select = () => chain;
    chain.single = () => Promise.resolve({ data: { id: "run-1" }, error: null });
    chain.update = (patch: Record<string, unknown>) => {
      const entry = { patch, eqId: undefined as string | undefined };
      updates.push(entry);
      return {
        eq: (_col: string, value: string) => {
          entry.eqId = value;
          return Promise.resolve({ error: null });
        },
      };
    };

    return chain;
  });

  return { client: { from }, inserted, updates };
}

describe("startJobRun / finishJobRun", () => {
  it("inserts a running row and returns its id", async () => {
    const { client, inserted } = buildMockClient();
    getSupabaseAdminClientMock.mockResolvedValue(client);

    const id = await startJobRun("booking-reminders");

    expect(id).toBe("run-1");
    expect(inserted).toEqual([{ job_name: "booking-reminders", status: "running" }]);
  });

  it("updates the run with a completed status and summary", async () => {
    const { client, updates } = buildMockClient();
    getSupabaseAdminClientMock.mockResolvedValue(client);

    await finishJobRun("run-1", "completed", { summary: { sent: 3 } });

    expect(updates).toHaveLength(1);
    expect(updates[0].patch).toMatchObject({ status: "completed", summary: { sent: 3 }, error: null });
    expect(updates[0].eqId).toBe("run-1");
  });

  it("updates the run with a failed status and error message", async () => {
    const { client, updates } = buildMockClient();
    getSupabaseAdminClientMock.mockResolvedValue(client);

    await finishJobRun("run-1", "failed", { error: "boom" });

    expect(updates[0].patch).toMatchObject({ status: "failed", summary: null, error: "boom" });
  });
});
