import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseAdminClientMock,
  sendBookingReminderEmailMock,
  sendBookingReminderWhatsAppMock,
  sendPostBookingFollowUpEmailMock,
  sendPostBookingFollowUpWhatsAppMock,
} = vi.hoisted(() => ({
  getSupabaseAdminClientMock: vi.fn(),
  sendBookingReminderEmailMock: vi.fn(),
  sendBookingReminderWhatsAppMock: vi.fn(),
  sendPostBookingFollowUpEmailMock: vi.fn(),
  sendPostBookingFollowUpWhatsAppMock: vi.fn(),
}));

vi.mock("./_core", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

vi.mock("@/server/booking-notifications", () => ({
  getAvailableReminderChannels: (input: { customerEmail?: string | null; customerPhone?: string | null }) => {
    const channels: string[] = [];
    if (input.customerEmail) channels.push("email");
    return channels;
  },
  hasReminderProviderConfigured: () => true,
  isTwilioConfigured: () => false,
  sendBookingReminderEmail: sendBookingReminderEmailMock,
  sendBookingReminderWhatsApp: sendBookingReminderWhatsAppMock,
  sendPostBookingFollowUpEmail: sendPostBookingFollowUpEmailMock,
  sendPostBookingFollowUpWhatsApp: sendPostBookingFollowUpWhatsAppMock,
}));

vi.mock("@/server/public-booking-links", () => ({
  buildAbsoluteReviewUrl: () => "https://reservaya.ar/demo/resena?booking=1&token=x",
  canGenerateBookingManageLinks: () => false,
  createBookingManageToken: () => "token",
}));

import { zonedDateTimeToUtcMs, toCommunicationEventStatus, insertCommunicationEvent } from "./reminders";

type Row = Record<string, unknown>;

/**
 * Minimal chainable query builder: filters are ignored (tests scope the fixture
 * data per-table instead), select() resolves to the full table array, insert()
 * delegates to a per-table handler so tests can simulate unique-violation errors.
 */
function buildMockClient(
  tableRows: Record<string, Row[]>,
  insertHandlers: Record<string, (row: Row) => { error: { code: string } | null }> = {}
) {
  const inserted: Record<string, Row[]> = {};
  const updates: Array<{ table: string; patch: Row }> = [];

  const from = vi.fn((table: string) => {
    const rows = tableRows[table] ?? [];

    const chain: Record<string, unknown> = {};
    const chainable = () => chain;
    chain.select = chainable;
    chain.eq = chainable;
    chain.in = chainable;
    chain.order = chainable;
    chain.limit = chainable;
    chain.then = (onFulfilled: (v: { data: Row[]; error: null }) => unknown) =>
      onFulfilled({ data: rows, error: null });

    chain.insert = (row: Row) => {
      inserted[table] = inserted[table] ?? [];
      inserted[table].push(row);
      const handler = insertHandlers[table];
      const result = handler ? handler(row) : { error: null };
      return Promise.resolve(result);
    };

    chain.update = (patch: Row) => {
      updates.push({ table, patch });
      return chain;
    };

    return chain;
  });

  return { client: { from }, inserted, updates };
}

describe("zonedDateTimeToUtcMs", () => {
  it("converts Argentina wall-clock time to the correct UTC instant", () => {
    const ms = zonedDateTimeToUtcMs("2026-03-20", "14:00", "America/Argentina/Buenos_Aires");
    expect(new Date(ms).toISOString()).toBe("2026-03-20T17:00:00.000Z");
  });

  it("treats a UTC timezone as a no-op offset", () => {
    const ms = zonedDateTimeToUtcMs("2026-03-20", "14:00", "UTC");
    expect(new Date(ms).toISOString()).toBe("2026-03-20T14:00:00.000Z");
  });
});

describe("runSupabaseBookingReminderSweep", () => {
  beforeEach(() => {
    vi.resetModules();
    sendBookingReminderEmailMock.mockReset();
    sendBookingReminderWhatsAppMock.mockReset();
    sendPostBookingFollowUpEmailMock.mockReset();
    sendPostBookingFollowUpWhatsAppMock.mockReset();
  });

  it("does not auto-complete an Argentina-time booking early when the host clock is UTC", async () => {
    // Booking ends at 18:00 ART = 21:00Z. "now" is 19:30Z: only 30 min past ART end time
    // (well under the 1h grace window). The pre-fix naive-UTC parse would read "18:00" as
    // 18:00Z, making 19:30Z look like 1h30 past end - past the grace window - and wrongly
    // auto-complete the booking.
    const booking = {
      id: "b1",
      bookingDate: "2026-03-20",
      endTime: "18:00",
      business: { timezone: "America/Argentina/Buenos_Aires" },
    };
    const { client, updates } = buildMockClient({
      businesses: [],
      bookings: [booking],
    });
    getSupabaseAdminClientMock.mockResolvedValue(client);

    const { runSupabaseBookingReminderSweep } = await import("./reminders");
    const result = await runSupabaseBookingReminderSweep({ now: "2026-03-20T19:30:00.000Z" });

    expect(updates.filter((u) => u.table === "bookings" && u.patch.status === "completed")).toHaveLength(0);
    expect(result.autoCompleted).toBe(0);
  });

  it("does auto-complete once the grace window has actually elapsed in business-local time", async () => {
    // Same booking, but "now" is 22:30Z - 1h30 past the real 21:00Z (18:00 ART) end time,
    // safely past the 1h grace window in the correct timezone.
    const booking = {
      id: "b1",
      bookingDate: "2026-03-20",
      endTime: "18:00",
      business: { timezone: "America/Argentina/Buenos_Aires" },
    };
    const { client, updates } = buildMockClient({
      businesses: [],
      bookings: [booking],
    });
    getSupabaseAdminClientMock.mockResolvedValue(client);

    const { runSupabaseBookingReminderSweep } = await import("./reminders");
    const result = await runSupabaseBookingReminderSweep({ now: "2026-03-20T22:30:00.000Z" });

    expect(updates.filter((u) => u.table === "bookings" && u.patch.status === "completed")).toHaveLength(1);
    expect(result.autoCompleted).toBe(1);
  });
});

describe("toCommunicationEventStatus", () => {
  it("maps provider result statuses to the communication_events enum", () => {
    expect(toCommunicationEventStatus("sent")).toBe("sent");
    expect(toCommunicationEventStatus("skipped")).toBe("skipped");
    expect(toCommunicationEventStatus("error")).toBe("failed");
  });
});

describe("insertCommunicationEvent", () => {
  it("returns true when the insert lands", async () => {
    const { client } = buildMockClient({}, { communication_events: () => ({ error: null }) });

    const wasNew = await insertCommunicationEvent(client as never, {
      business_id: "biz1",
      booking_id: "b1",
      customer_id: "cust1",
      channel: "email",
      kind: "reminder",
      status: "sent",
    });

    expect(wasNew).toBe(true);
  });

  it("swallows a unique-constraint violation as an already-sent no-op instead of throwing", async () => {
    const { client } = buildMockClient(
      {},
      { communication_events: () => ({ error: { code: "23505" } }) }
    );

    const wasNew = await insertCommunicationEvent(client as never, {
      business_id: "biz1",
      booking_id: "b1",
      customer_id: "cust1",
      channel: "email",
      kind: "reminder",
      status: "sent",
    });

    expect(wasNew).toBe(false);
  });

  it("re-throws any other insert error", async () => {
    const { client } = buildMockClient(
      {},
      { communication_events: () => ({ error: { code: "42501" } }) }
    );

    await expect(
      insertCommunicationEvent(client as never, {
        business_id: "biz1",
        booking_id: "b1",
        customer_id: "cust1",
        channel: "email",
        kind: "reminder",
        status: "sent",
      })
    ).rejects.toMatchObject({ code: "42501" });
  });
});
