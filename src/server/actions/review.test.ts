import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStoreForTests } from "@/server/rate-limit";
import { createBookingReviewToken } from "@/server/public-booking-links";
import { submitReviewAction } from "./review";

const { createSupabaseReviewMock } = vi.hoisted(() => ({
  createSupabaseReviewMock: vi.fn(async () => "review-1"),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.44" })),
}));

vi.mock("@/server/supabase-store", () => ({
  createSupabaseReview: createSupabaseReviewMock,
}));

const TEST_SECRET = "test-booking-link-secret";

function buildExpiredReviewToken(slug: string, bookingId: string) {
  const encodedPayload = Buffer.from(
    JSON.stringify({ slug, bookingId, exp: Date.now() - 1000, scope: "review" }),
    "utf8"
  ).toString("base64url");
  const signature = createHmac("sha256", TEST_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function buildReviewFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("businessSlug", "demo-barberia");
  formData.set("bookingId", "booking-1");
  formData.set("manageToken", createBookingReviewToken("demo-barberia", "booking-1"));
  formData.set("rating", "5");
  formData.set("comment", "Excelente atención");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("submitReviewAction", () => {
  beforeEach(() => {
    process.env.BOOKING_LINK_SECRET = TEST_SECRET;
    resetRateLimitStoreForTests();
    createSupabaseReviewMock.mockClear();
  });

  it("registra la reseña correctamente", async () => {
    const result = await submitReviewAction(null, buildReviewFormData());

    expect(result).toEqual({ success: true });
    expect(createSupabaseReviewMock).toHaveBeenCalledWith({
      businessSlug: "demo-barberia",
      bookingId: "booking-1",
      rating: 5,
      comment: "Excelente atención",
    });
  });

  it("rechaza token inválido", async () => {
    const result = await submitReviewAction(
      null,
      buildReviewFormData({ manageToken: "token-falso" })
    );

    expect(result).toEqual({ success: false, error: "Link inválido o expirado." });
    expect(createSupabaseReviewMock).not.toHaveBeenCalled();
  });

  it("rechaza token expirado", async () => {
    const result = await submitReviewAction(
      null,
      buildReviewFormData({
        manageToken: buildExpiredReviewToken("demo-barberia", "booking-1"),
      })
    );

    expect(result).toEqual({ success: false, error: "Link inválido o expirado." });
    expect(createSupabaseReviewMock).not.toHaveBeenCalled();
  });

  it("rechaza token de otro turno", async () => {
    const result = await submitReviewAction(
      null,
      buildReviewFormData({
        manageToken: createBookingReviewToken("demo-barberia", "otro-booking"),
      })
    );

    expect(result).toEqual({ success: false, error: "Link inválido o expirado." });
    expect(createSupabaseReviewMock).not.toHaveBeenCalled();
  });

  it("rechaza rating fuera de rango", async () => {
    const result = await submitReviewAction(null, buildReviewFormData({ rating: "9" }));

    expect(result).toEqual({ success: false, error: "Revisá los datos ingresados." });
    expect(createSupabaseReviewMock).not.toHaveBeenCalled();
  });

  it("rechaza rating no entero", async () => {
    const result = await submitReviewAction(null, buildReviewFormData({ rating: "4.5" }));

    expect(result).toEqual({ success: false, error: "Revisá los datos ingresados." });
    expect(createSupabaseReviewMock).not.toHaveBeenCalled();
  });

  it("propaga el error del store cuando el turno no está completado", async () => {
    createSupabaseReviewMock.mockRejectedValueOnce(
      new Error("Solo podes dejar una reseña despues de completar el turno.")
    );

    const result = await submitReviewAction(null, buildReviewFormData());

    expect(result).toEqual({
      success: false,
      error: "Solo podes dejar una reseña despues de completar el turno.",
    });
  });

  it("propaga el error del store ante reseña duplicada u otros fallos", async () => {
    createSupabaseReviewMock.mockRejectedValueOnce(new Error("No encontramos el turno."));

    const result = await submitReviewAction(null, buildReviewFormData());

    expect(result).toEqual({ success: false, error: "No encontramos el turno." });
  });

  it("aplica rate limit por turno tras reintentos repetidos", async () => {
    for (let i = 0; i < 5; i += 1) {
      const result = await submitReviewAction(null, buildReviewFormData());
      expect(result).toEqual({ success: true });
    }

    const blocked = await submitReviewAction(null, buildReviewFormData());

    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error).toContain("Demasiados intentos de reseña para este turno.");
    }
    expect(createSupabaseReviewMock).toHaveBeenCalledTimes(5);
  });
});
