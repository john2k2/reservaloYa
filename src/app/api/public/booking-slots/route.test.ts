import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicBookingFlowDataMock } = vi.hoisted(() => ({
  getPublicBookingFlowDataMock: vi.fn(),
}));

vi.mock("@/server/queries/public", () => ({
  getPublicBookingFlowData: getPublicBookingFlowDataMock,
}));

describe("public booking slots route", () => {
  beforeEach(() => {
    vi.resetModules();
    getPublicBookingFlowDataMock.mockReset();
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
});
