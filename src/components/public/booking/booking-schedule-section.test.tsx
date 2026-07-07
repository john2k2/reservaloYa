import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { BookingScheduleSection } from "@/components/public/booking/booking-schedule-section";

const DATE_A = "2026-03-20";
const DATE_B = "2026-03-21";
const TODAY = "2026-03-19";

function mockSlotsFetch(slotsByDate: Record<string, string[]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      const date = url.searchParams.get("date") ?? "";
      return {
        ok: true,
        json: async () => ({ bookingDate: date, slots: slotsByDate[date] ?? [] }),
      } as Response;
    })
  );
}

describe("BookingScheduleSection", () => {
  beforeEach(() => {
    mockSlotsFetch({
      [DATE_A]: ["10:00", "11:00"],
      [DATE_B]: ["09:00"],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears the selected slot when the date changes", async () => {
    const user = userEvent.setup();
    const onSelectSlot = vi.fn();

    render(
      <BookingScheduleSection
        slug="demo-barberia"
        serviceId="service-1"
        accentColor="#111111"
        initialSelectedDate={DATE_A}
        initialDateOptions={[DATE_A, DATE_B]}
        todayDate={TODAY}
        onSelectSlot={onSelectSlot}
      />
    );

    await waitFor(() => expect(screen.getByLabelText(/^Horario 10:00/)).toBeInTheDocument());

    await user.click(screen.getByLabelText(/^Horario 10:00/));
    expect(onSelectSlot).toHaveBeenLastCalledWith("10:00");

    const dateButtonB = screen.getAllByRole("button", { name: /21 de marzo/i })[0];
    await user.click(dateButtonB);

    expect(onSelectSlot).toHaveBeenLastCalledWith("");

    await waitFor(() => expect(screen.getByLabelText(/^Horario 09:00/)).toBeInTheDocument());
  });
});
