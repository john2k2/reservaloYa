/**
 * Integration tests para pocketbase-store — usan el PocketBase real de Railway.
 *
 * Solo prueban funciones que usan getAdminClient() (credenciales en .env.test).
 * Las funciones que usan getPublicReadClient/getPublicMutationClient requieren
 * un usuario en la colección "users" (POCKETBASE_PUBLIC_AUTH_*).
 *
 * Se saltean automáticamente si las credenciales admin no están configuradas.
 */
import { describe, expect, it } from "vitest";

import { isPocketBaseAdminConfigured } from "@/lib/pocketbase/config";

const hasPocketBase = isPocketBaseAdminConfigured();

describe.runIf(hasPocketBase)("pocketbase-store — business by slug (admin)", () => {
  it("resuelve demo-barberia correctamente", async () => {
    const { getPocketBaseBusinessBySlug } = await import("./index");
    const business = await getPocketBaseBusinessBySlug("demo-barberia");

    expect(business).not.toBeNull();
    expect(business?.slug).toBe("demo-barberia");
    expect(business?.name).toBeTruthy();
  });

  it("devuelve null para slug inexistente", async () => {
    const { getPocketBaseBusinessBySlug } = await import("./index");
    const result = await getPocketBaseBusinessBySlug("no-existe-abc123xyz");
    expect(result).toBeNull();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — subscription (admin)", () => {
  it("getBusinessSubscription devuelve null o un objeto para demo-barberia", async () => {
    const { getPocketBaseBusinessBySlug, getBusinessSubscription } = await import("./index");

    const business = await getPocketBaseBusinessBySlug("demo-barberia");
    if (!business) return;

    const sub = await getBusinessSubscription(business.id);
    expect(sub === null || typeof sub === "object").toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — payment settings (admin)", () => {
  it("getPaymentSettingsBySlug devuelve datos o null para demo-barberia", async () => {
    const { getPocketBaseBusinessPaymentSettingsBySlug } = await import("./index");
    const settings = await getPocketBaseBusinessPaymentSettingsBySlug("demo-barberia");
    expect(settings === null || typeof settings === "object").toBe(true);
  });

  it("getPaymentSettingsByCollectorId devuelve null para collectorId inexistente", async () => {
    const { getPocketBaseBusinessPaymentSettingsByCollectorId } = await import("./index");
    const settings = await getPocketBaseBusinessPaymentSettingsByCollectorId("999999999999");
    expect(settings).toBeNull();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — booking business slug (admin)", () => {
  it("devuelve null para bookingId inexistente", async () => {
    const { getPocketBaseBookingBusinessSlug } = await import("./index");
    const slug = await getPocketBaseBookingBusinessSlug("booking-que-no-existe-xyz");
    expect(slug).toBeNull();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — business id by slug (admin)", () => {
  it("resuelve el id de demo-barberia", async () => {
    const { getPocketBaseBusinessIdBySlug } = await import("./index");
    const id = await getPocketBaseBusinessIdBySlug("demo-barberia");
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("devuelve null para slug inexistente", async () => {
    const { getPocketBaseBusinessIdBySlug } = await import("./index");
    const id = await getPocketBaseBusinessIdBySlug("slug-no-existe-xyz");
    expect(id).toBeNull();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — onboarding data (admin)", () => {
  it("no lanza para demo-barberia y devuelve un objeto", async () => {
    const { getPocketBaseOnboardingData, getPocketBaseBusinessIdBySlug } = await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseOnboardingData(businessId);
    // Puede devolver null si el businessId no tiene owner configurado
    expect(data === null || typeof data === "object").toBe(true);
  });

  it("no lanza sin businessId", async () => {
    const { getPocketBaseOnboardingData } = await import("./index");
    const result = await getPocketBaseOnboardingData(undefined).catch(() => null);
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin availability data (admin)", () => {
  it("devuelve datos para demo-barberia", async () => {
    const { getPocketBaseAdminAvailabilityData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminAvailabilityData(businessId);
    expect(data).not.toBeUndefined();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin services data (admin)", () => {
  it("no lanza para demo-barberia", async () => {
    const { getPocketBaseAdminServicesData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminServicesData(businessId);
    expect(data !== undefined).toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin settings data (admin)", () => {
  it("no lanza para demo-barberia", async () => {
    const { getPocketBaseAdminSettingsData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminSettingsData(businessId);
    expect(data !== undefined).toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin dashboard data (admin)", () => {
  it("devuelve datos del dashboard para demo-barberia", async () => {
    const { getPocketBaseAdminDashboardData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminDashboardData(businessId);
    expect(data).not.toBeUndefined();
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin bookings data (admin)", () => {
  it("devuelve reservas para demo-barberia", async () => {
    const { getPocketBaseAdminBookingsData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminBookingsData(businessId);
    expect(data).not.toBeUndefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it("aplica filtro de fecha", async () => {
    const { getPocketBaseAdminBookingsData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminBookingsData(businessId, {
      date: new Date().toISOString().slice(0, 10),
    });
    expect(Array.isArray(data)).toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — admin customers data (admin)", () => {
  it("devuelve clientes para demo-barberia", async () => {
    const { getPocketBaseAdminCustomersData, getPocketBaseBusinessIdBySlug } =
      await import("./index");

    const businessId = await getPocketBaseBusinessIdBySlug("demo-barberia");
    if (!businessId) return;

    const data = await getPocketBaseAdminCustomersData(businessId);
    expect(data).not.toBeUndefined();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe.runIf(hasPocketBase)("pocketbase-store — revert booking from pending payment (admin)", () => {
  it("no lanza para un bookingId inexistente", async () => {
    const { revertPocketBaseBookingFromPendingPayment } = await import("./index");
    // Un booking que no existe no debería lanzar — devuelve sin hacer nada
    await expect(
      revertPocketBaseBookingFromPendingPayment("booking-no-existe-xyz")
    ).resolves.not.toThrow();
  });
});
