import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicBookingFlowDataMock, consumeRateLimitMock, getRateLimitIdentifierMock } = vi.hoisted(
  () => ({
    getPublicBookingFlowDataMock: vi.fn(),
    consumeRateLimitMock: vi.fn(),
    getRateLimitIdentifierMock: vi.fn(),
  })
);

vi.mock("@/server/queries/public", () => ({
  getPublicBookingFlowData: getPublicBookingFlowDataMock,
}));

vi.mock("@/server/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  getRateLimitIdentifier: getRateLimitIdentifierMock,
}));

describe("public booking slots route", () => {
  beforeEach(() => {
    vi.resetModules();
    getPublicBookingFlowDataMock.mockReset();
    consumeRateLimitMock.mockReset();
    getRateLimitIdentifierMock.mockReset();

    getRateLimitIdentifierMock.mockReturnValue("ip-1");
    consumeRateLimitMock.mockResolvedValue({
      ok: true,
      remaining: 99,
      retryAfterSeconds: 0,
      store: "memory" as const,
    });
  });

  it("returns 400 when required params are missing", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/public/booking-slots?slug=demo-barberia"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Faltan parametros para cargar horarios." });
    expect(getPublicBookingFlowDataMock).not.toHaveBeenCalled();
  });

  it("returns 404 when availability flow does not exist", async () => {
    getPublicBookingFlowDataMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/public/booking-slots?slug=demo-barberia&serviceId=svc-1&date=2026-03-30")
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "No se encontro disponibilidad para este negocio." });
    expect(getPublicBookingFlowDataMock).toHaveBeenCalledWith({
      slug: "demo-barberia",
      serviceId: "svc-1",
      bookingDate: "2026-03-30",
    });
  });

  it("returns booking date and slots when flow exists", async () => {
    getPublicBookingFlowDataMock.mockResolvedValue({
      bookingDate: "2026-03-30",
      slots: ["10:00", "10:30"],
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/public/booking-slots?slug=demo-barberia&serviceId=svc-1&date=2026-03-30")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      bookingDate: "2026-03-30",
      slots: ["10:00", "10:30"],
    });
  });

  it("returns 503 when the availability lookup throws", async () => {
    getPublicBookingFlowDataMock.mockRejectedValue(new Error("boom"));
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/public/booking-slots?slug=demo-barberia&serviceId=svc-1&date=2026-03-30")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "No pudimos cargar los horarios en este momento." });
  });

  it("applies rate limiting by IP before querying availability", async () => {
    getRateLimitIdentifierMock.mockReturnValue("1.2.3.4");
    getPublicBookingFlowDataMock.mockResolvedValue({
      bookingDate: "2026-03-30",
      slots: ["10:00"],
    });
    const { GET } = await import("./route");

    await GET(
      new Request("http://localhost/api/public/booking-slots?slug=demo-barberia&serviceId=svc-1&date=2026-03-30", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      })
    );

    expect(getRateLimitIdentifierMock).toHaveBeenCalledWith(expect.any(Headers), "anonymous");
    expect(consumeRateLimitMock).toHaveBeenCalledWith({
      bucket: "public-booking-slots",
      identifier: "1.2.3.4",
      max: 100,
      windowMs: 60_000,
    });
    expect(getPublicBookingFlowDataMock).toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate limit is exceeded", async () => {
    getRateLimitIdentifierMock.mockReturnValue("ip-blocked");
    consumeRateLimitMock.mockResolvedValue({
      ok: false,
      remaining: 0,
      retryAfterSeconds: 45,
      store: "memory" as const,
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/public/booking-slots?slug=demo-barberia&serviceId=svc-1&date=2026-03-30")
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(body).toEqual({ error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos." });
    expect(getPublicBookingFlowDataMock).not.toHaveBeenCalled();
  });
});
