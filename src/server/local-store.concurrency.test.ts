import { copyFile } from "node:fs/promises";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { resetBookingLocksForTests } from "@/server/booking-slot-lock";
import {
  createLocalPublicBooking,
  getLocalPublicBookingFlowData,
} from "@/server/local-store";

async function resetLocalRuntimeStore() {
  const dataDir = path.join(process.cwd(), "data");
  await copyFile(path.join(dataDir, "local-store.seed.json"), path.join(dataDir, "local-store.json"));
}

describe.sequential("local booking concurrency", () => {
  beforeEach(async () => {
    await resetLocalRuntimeStore();
    resetBookingLocksForTests();
  });

  it("prevents double booking when two creates race on the same slot", async () => {
    const flow = await getLocalPublicBookingFlowData({ slug: "demo-barberia" });

    if (!flow?.selectedService || flow.slots.length === 0) {
      throw new Error("No hay slots disponibles en el seed para correr la prueba de concurrencia.");
    }

    const baseInput = {
      businessSlug: "demo-barberia",
      serviceId: flow.selectedService.id,
      bookingDate: flow.bookingDate,
      startTime: flow.slots[0],
      email: "",
      notes: "",
    };

    const [firstResult, secondResult] = await Promise.allSettled([
      createLocalPublicBooking({
        ...baseInput,
        fullName: "Cliente A",
        phone: "1100000001",
      }),
      createLocalPublicBooking({
        ...baseInput,
        fullName: "Cliente B",
        phone: "1100000002",
      }),
    ]);

    const fulfilledCount = [firstResult, secondResult].filter(
      (result) => result.status === "fulfilled"
    ).length;
    const rejectedMessages = [firstResult, secondResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => String(result.reason?.message ?? ""));

    expect(fulfilledCount).toBe(1);
    expect(rejectedMessages.some((message) => message.includes("ya no esta disponible"))).toBe(true);
  });
});
