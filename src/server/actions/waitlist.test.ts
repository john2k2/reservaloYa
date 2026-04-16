import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStoreForTests } from "@/server/rate-limit";
import { joinWaitlistAction } from "./waitlist";

const { createLocalWaitlistEntryMock, createPocketBaseWaitlistEntryMock } = vi.hoisted(() => ({
  createLocalWaitlistEntryMock: vi.fn(async () => undefined),
  createPocketBaseWaitlistEntryMock: vi.fn(async () => undefined),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  hasPocketBasePublicAuthCredentials: vi.fn(() => false),
}));

vi.mock("@/lib/runtime", () => ({
  isDemoModeEnabled: vi.fn(() => false),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.33" })),
}));

vi.mock("@/server/local-store", () => ({
  createLocalWaitlistEntry: createLocalWaitlistEntryMock,
}));

vi.mock("@/server/pocketbase-store", () => ({
  createPocketBaseWaitlistEntry: createPocketBaseWaitlistEntryMock,
}));

function buildWaitlistFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("serviceId", "service-1");
  formData.set("bookingDate", "2026-04-20");
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
    createLocalWaitlistEntryMock.mockClear();
    createPocketBaseWaitlistEntryMock.mockClear();
  });

  it("registra correctamente en el store local", async () => {
    const result = await joinWaitlistAction(null, buildWaitlistFormData());

    expect(result).toEqual({ success: true });
    expect(createLocalWaitlistEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessSlug: "demo-barberia",
        serviceId: "service-1",
        bookingDate: "2026-04-20",
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
    expect(createLocalWaitlistEntryMock).toHaveBeenCalledWith(
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
    expect(createLocalWaitlistEntryMock).not.toHaveBeenCalled();
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

  it("devuelve error si el store lanza excepción", async () => {
    createLocalWaitlistEntryMock.mockRejectedValueOnce(new Error("DB error"));

    const result = await joinWaitlistAction(null, buildWaitlistFormData());

    expect(result).toEqual({
      success: false,
      error: "No se pudo registrar. Intentá de nuevo.",
    });
  });

  it("usa PocketBase cuando está configurado", async () => {
    const { hasPocketBasePublicAuthCredentials } = await import(
      "@/lib/pocketbase/config"
    );
    vi.mocked(hasPocketBasePublicAuthCredentials).mockReturnValueOnce(true);

    const result = await joinWaitlistAction(null, buildWaitlistFormData());

    expect(result).toEqual({ success: true });
    expect(createPocketBaseWaitlistEntryMock).toHaveBeenCalled();
    expect(createLocalWaitlistEntryMock).not.toHaveBeenCalled();
  });

  it("rate-limitea envíos repetidos de waitlist", async () => {
    let lastResult = null;

    for (let index = 0; index < 6; index += 1) {
      lastResult = await joinWaitlistAction(null, buildWaitlistFormData());
    }

    expect(lastResult).toEqual({
      success: false,
      error: expect.stringContaining("Demasiados intentos de lista de espera"),
    });
  });
});
