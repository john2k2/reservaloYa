import { copyFile } from "node:fs/promises";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { addMinutes } from "@/lib/bookings/format";
import { resetBookingLocksForTests } from "@/server/booking-slot-lock";
import {
  createLocalBlockedSlot,
  createLocalPublicBooking,
  getLocalPublicBookingFlowData,
  updateLocalAdminBooking,
} from "@/server/local-store";

async function resetLocalRuntimeStore() {
  const dataDir = path.join(process.cwd(), "data");
  await copyFile(path.join(dataDir, "local-store.seed.json"), path.join(dataDir, "local-store.json"));
}

describe.sequential("local booking schedule QA", () => {
  beforeEach(async () => {
    await resetLocalRuntimeStore();
    resetBookingLocksForTests();
  });
  it("removes blocked slots from the public booking flow", async () => {
    const initialFlow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!initialFlow?.selectedService || initialFlow.slots.length < 2) {
      throw new Error("El seed local no tiene suficientes slots para probar bloqueos.");
    }

    const slotToBlock = initialFlow.slots[1];

    await createLocalBlockedSlot({
      businessSlug: "demo-barberia",
      blockedDate: initialFlow.bookingDate,
      startTime: slotToBlock,
      endTime: addMinutes(slotToBlock, initialFlow.selectedService.durationMinutes),
      reason: "QA bloqueo",
    });

    const updatedFlow = await getLocalPublicBookingFlowData({
      slug: "demo-barberia",
      serviceId: initialFlow.selectedService.id,
      bookingDate: initialFlow.bookingDate,
    });

    expect(updatedFlow?.slots).not.toContain(slotToBlock);
  });

  it("prevents admin rescheduling a booking into an already occupied slot", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length < 2) {
      throw new Error("El seed local no tiene suficientes slots para probar conflictos.");
    }

    const firstSlot = flow.slots[0];
    const secondSlot = flow.slots.find(
      (slot) => slot >= addMinutes(firstSlot, flow.selectedService.durationMinutes)
    );

    if (!secondSlot) {
      throw new Error("El seed local no tiene un segundo slot no solapado para probar conflictos.");
    }

    const firstBookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: firstSlot,
      fullName: "Cliente QA A",
      phone: "1100001001",
      email: "",
      notes: "",
    });

    await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: secondSlot,
      fullName: "Cliente QA B",
      phone: "1100001002",
      email: "",
      notes: "",
    });

    await expect(
      updateLocalAdminBooking({
        businessSlug: "demo-barberia",
        bookingId: firstBookingId,
        bookingDate: flow.bookingDate,
        startTime: secondSlot,
        status: "confirmed",
        notes: "Mover a slot ocupado",
      })
    ).rejects.toThrow("Ese horario ya no esta disponible.");
  });

  it("prevents admin moving a booking outside configured availability", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length === 0) {
      throw new Error("El seed local no tiene slots para probar disponibilidad.");
    }

    const bookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      fullName: "Cliente QA C",
      phone: "1100001003",
      email: "",
      notes: "",
    });

    await expect(
      updateLocalAdminBooking({
        businessSlug: "demo-barberia",
        bookingId,
        bookingDate: flow.bookingDate,
        startTime: "23:00",
        status: "confirmed",
        notes: "Fuera de horario",
      })
    ).rejects.toThrow("Ese horario queda fuera de la disponibilidad configurada.");
  });
});
