import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runSupabaseBookingReminderSweepMock, startJobRunMock, finishJobRunMock } = vi.hoisted(() => ({
  runSupabaseBookingReminderSweepMock: vi.fn(),
  startJobRunMock: vi.fn(),
  finishJobRunMock: vi.fn(),
}));

vi.mock("@/server/supabase-store", () => ({
  runSupabaseBookingReminderSweep: runSupabaseBookingReminderSweepMock,
  startJobRun: startJobRunMock,
  finishJobRun: finishJobRunMock,
}));

const ORIGINAL_ENV = { ...process.env };
const writableEnv = process.env as Record<string, string | undefined>;

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

describe("GET /api/jobs/booking-reminders", () => {
  beforeEach(() => {
    vi.resetModules();
    runSupabaseBookingReminderSweepMock.mockReset();
    startJobRunMock.mockReset();
    finishJobRunMock.mockReset();
    startJobRunMock.mockResolvedValue("run-1");
    runSupabaseBookingReminderSweepMock.mockResolvedValue({ sent: 1 });
    writableEnv.BOOKING_JOBS_SECRET = "real-secret";
    writableEnv.NODE_ENV = "production";
  });

  afterEach(resetEnv);

  it("rejects a request with no matching secret", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("https://x/api/jobs/booking-reminders"));

    expect(response.status).toBe(401);
    expect(startJobRunMock).not.toHaveBeenCalled();
  });

  it("rejects a secret of different length without throwing (timing-safe guard)", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://x/api/jobs/booking-reminders", {
        headers: { authorization: "Bearer short" },
      })
    );

    expect(response.status).toBe(401);
  });

  it("accepts the configured secret and records a completed job run", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://x/api/jobs/booking-reminders", {
        headers: { authorization: "Bearer real-secret" },
      })
    );

    expect(response.status).toBe(200);
    expect(startJobRunMock).toHaveBeenCalledWith("booking-reminders");
    expect(finishJobRunMock).toHaveBeenCalledWith("run-1", "completed", { summary: { sent: 1 } });
  });

  it("records a failed job run when the sweep throws, and still returns 500", async () => {
    runSupabaseBookingReminderSweepMock.mockRejectedValue(new Error("db down"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://x/api/jobs/booking-reminders", {
        headers: { authorization: "Bearer real-secret" },
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "Internal error" });
    expect(finishJobRunMock).toHaveBeenCalledWith("run-1", "failed", { error: "db down" });
  });

  it("skips job-run tracking on a dry run", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://x/api/jobs/booking-reminders?dryRun=1", {
        headers: { authorization: "Bearer real-secret" },
      })
    );

    expect(response.status).toBe(200);
    expect(startJobRunMock).not.toHaveBeenCalled();
    expect(finishJobRunMock).not.toHaveBeenCalled();
  });
});
