import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminShellDataMock, getAdminBookingsDataMock } = vi.hoisted(() => ({
  getAdminShellDataMock: vi.fn(),
  getAdminBookingsDataMock: vi.fn(),
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
  getAdminBookingsData: getAdminBookingsDataMock,
}));

describe("bookings export route", () => {
  beforeEach(() => {
    getAdminShellDataMock.mockReset();
    getAdminBookingsDataMock.mockReset();
  });

  it("returns 401 for anonymous users", async () => {
    getAdminShellDataMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/admin/export/bookings"));

    expect(response.status).toBe(401);
  });

  it("returns a csv for authenticated admins", async () => {
    getAdminShellDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
    getAdminBookingsDataMock.mockResolvedValue([
      {
        bookingDate: "2026-03-20",
        startTime: "10:00",
        customerName: "Juan Perez",
        phone: "1122334455",
        serviceName: "Corte",
        statusLabel: "Confirmado",
        notes: "Cliente frecuente",
      },
    ]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/admin/export/bookings?status=confirmed&q=Juan")
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("demo-barberia-agenda-");
    expect(body).toContain("Juan Perez");
    expect(getAdminBookingsDataMock).toHaveBeenCalledWith(
      {
        status: "confirmed",
        date: "",
        q: "Juan",
      },
      { limit: 10000 }
    );
  });

  it("sanitizes formula-prefixed values to prevent CSV injection", async () => {
    getAdminShellDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
    getAdminBookingsDataMock.mockResolvedValue([
      {
        bookingDate: "2026-03-20",
        startTime: "10:00",
        customerName: "=CMD|' /C calc'!A0",
        phone: "+1122334455",
        serviceName: "@SUM(A1:A2)",
        statusLabel: "-Confirmado",
        notes: "+123456",
      },
    ]);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/admin/export/bookings"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("'=CMD|' /C calc'!A0");
    expect(body).toContain("'@SUM(A1:A2)");
    expect(body).toContain("'-Confirmado");
    expect(body).toContain("'+123456");
    expect(body).not.toContain(",=CMD");
    expect(body).not.toContain(",@SUM");
  });
});
