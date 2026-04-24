import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStoreForTests } from "@/server/rate-limit";
import { joinWaitlistAction } from "./waitlist";

const { createSupabaseWaitlistEntryMock } = vi.hoisted(() => ({
  createSupabaseWaitlistEntryMock: vi.fn(async () => undefined),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.33" })),
}));

vi.mock("@/server/supabase-store", () => ({
  createSupabaseWaitlistEntry: createSupabaseWaitlistEntryMock,
}));

function futureDateString(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(20);
  return d.toISOString().slice(0, 10);
}

function buildWaitlistFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("serviceId", "service-1");
  formData.set("bookingDate", futureDateString());
  formData.set("fullName", "Maria Gonzalez");
  formData.set("email", "maria@example.com");
  formData.set("phone", "1155556666");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("joinWaitlistAction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    createSupabaseWaitlistEntryMock.mockClear();
  });

  it("registra correctamente en el store", async () => {
    const bookingDate = futureDateString();
    const result = await joinWaitlistAction(null, buildWaitlistFormData({ bookingDate }));

    expect(result).toEqual({ success: true });
    expect(createSupabaseWaitlistEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessSlug: "demo-barberia",
        serviceId: "service-1",
        bookingDate,
        fullName: "Maria Gonzalez",
        email: "maria@example.com",
      })
    );
  });

  it("acepta teléfono vacío como opcional", async () => {
    const result = await joinWaitlistAction(
      null,
      buildWaitlistFormData({ phone: "" })
    );

    expect(result).toEqual({ success: true });
    expect(createSupabaseWaitlistEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({ phone: undefined })
    );
  });

  it("rechaza email inválido", async () => {
    const result = await joinWaitlistAction(
      null,
      buildWaitlistFormData({ email: "no-es-un-email" })
    );

    expect(result).toEqual({
      success: false,
      error: "Revisá los datos ingresados.",
    });
    expect(createSupabaseWaitlistEntryMock).not.toHaveBeenCalled();
  });

  it("rechaza fecha en formato incorrecto", async () => {
    const result = await joinWaitlistAction(
      null,
      buildWaitlistFormData({ bookingDate: "20-04-2026" })
    );

    expect(result).toEqual({
      success: false,
      error: "Revisá los datos ingresados.",
    });
  });

  it("rechaza nombre muy corto", async () => {
    const result = await joinWaitlistAction(
      null,
      buildWaitlistFormData({ fullName: "A" })
    );

    expect(result).toEqual({
      success: false,
      error: "Revisá los datos ingresados.",
    });
  });
});
