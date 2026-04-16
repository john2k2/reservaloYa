import { copyFile } from "node:fs/promises";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { addMinutes } from "@/lib/bookings/format";
import { resetBookingLocksForTests } from "@/server/booking-slot-lock";
import {
  createLocalReview,
  createLocalWaitlistEntry,
  cancelLocalPublicBooking,
  createLocalBlockedSlot,
  createLocalPublicBooking,
  getLocalPublicBookingFlowData,
  updateLocalAdminBooking,
} from "@/server/local-store";
import { readStore } from "@/server/local-store/_core";

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

  it("prevents public rescheduling of closed bookings", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length < 2) {
      throw new Error("El seed local no tiene suficientes slots para probar reprogramación pública.");
    }

    const bookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      fullName: "Cliente QA D",
      phone: "1100001004",
      email: "qa-d@example.com",
      notes: "",
    });

    await updateLocalAdminBooking({
      businessSlug: "demo-barberia",
      bookingId,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      status: "completed",
      notes: "Turno ya cerrado",
    });

    await expect(
      createLocalPublicBooking({
        businessSlug: "demo-barberia",
        serviceId: flow.selectedService.id,
        bookingDate: flow.bookingDate,
        startTime: flow.slots[1],
        fullName: "Cliente QA D",
        phone: "1100001004",
        email: "qa-d@example.com",
        notes: "",
        rescheduleBookingId: bookingId,
      })
    ).rejects.toThrow("Este turno ya no se puede reprogramar.");
  });

  it("prevents public cancellation of closed bookings", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length === 0) {
      throw new Error("El seed local no tiene slots para probar cancelación pública.");
    }

    const bookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      fullName: "Cliente QA E",
      phone: "1100001005",
      email: "qa-e@example.com",
      notes: "",
    });

    await updateLocalAdminBooking({
      businessSlug: "demo-barberia",
      bookingId,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      status: "completed",
      notes: "Turno cerrado",
    });

    await expect(
      cancelLocalPublicBooking({
        businessSlug: "demo-barberia",
        bookingId,
      })
    ).rejects.toThrow("Este turno ya no se puede cancelar.");
  });

  it("prevents reviews before the booking is completed", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length === 0) {
      throw new Error("El seed local no tiene slots para probar reseñas.");
    }

    const bookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      fullName: "Cliente QA F",
      phone: "1100001006",
      email: "qa-f@example.com",
      notes: "",
    });

    await expect(
      createLocalReview({
        businessSlug: "demo-barberia",
        bookingId,
        rating: 5,
        comment: "Excelente",
      })
    ).rejects.toThrow("Solo podés dejar una reseña después de completar el turno.");
  });

  it("derives review identity from the completed booking", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length === 0) {
      throw new Error("El seed local no tiene slots para probar reseñas completadas.");
    }

    const bookingId = await createLocalPublicBooking({
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      fullName: "Cliente QA G",
      phone: "1100001007",
      email: "qa-g@example.com",
      notes: "",
    });

    await updateLocalAdminBooking({
      businessSlug: "demo-barberia",
      bookingId,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      status: "completed",
      notes: "Turno finalizado",
    });

    await createLocalReview({
      businessSlug: "demo-barberia",
      bookingId,
      rating: 4,
      comment: "Muy bien",
    });

    const store = await readStore();
    const review = store.reviews.find((item) => item.bookingId === bookingId);

    expect(review).toMatchObject({
      serviceId: flow.selectedService.id,
      customerName: "Cliente QA G",
      rating: 4,
      comment: "Muy bien",
    });
  });

  it("rejects waitlist entries for services outside the business", async () => {
    await expect(
      createLocalWaitlistEntry({
        businessSlug: "demo-barberia",
        serviceId: "servicio-inexistente",
        bookingDate: "2026-04-20",
        fullName: "Cliente QA H",
        email: "qa-h@example.com",
        phone: "1100001008",
      })
    ).rejects.toThrow("No encontramos el servicio.");
  });
});
