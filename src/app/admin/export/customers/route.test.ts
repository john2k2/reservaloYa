import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminShellDataMock, getAdminCustomersDataWithFilterMock } = vi.hoisted(() => ({
  getAdminShellDataMock: vi.fn(),
  getAdminCustomersDataWithFilterMock: vi.fn(),
}));

vi.mock("@/server/queries/admin", () => ({
  getAdminShellData: getAdminShellDataMock,
  getAdminCustomersDataWithFilter: getAdminCustomersDataWithFilterMock,
}));

describe("customers export route", () => {
  beforeEach(() => {
    getAdminShellDataMock.mockReset();
    getAdminCustomersDataWithFilterMock.mockReset();
  });

  it("returns 401 when there is no authenticated admin", async () => {
    getAdminShellDataMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/admin/export/customers"));

    expect(response.status).toBe(401);
  });

  it("returns customer csv data for authenticated admins", async () => {
    getAdminShellDataMock.mockResolvedValue({
      businessSlug: "demo-barberia",
    });
    getAdminCustomersDataWithFilterMock.mockResolvedValue([
      {
        fullName: "Juan Perez",
        phone: "1122334455",
        email: "juan@example.com",
        notes: "Prefiere turno tarde",
        bookingsCount: 4,
        lastBookingDate: "2026-03-18",
      },
    ]);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/admin/export/customers?q=Juan"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("demo-barberia-clientes-");
    expect(body).toContain("juan@example.com");
    expect(getAdminCustomersDataWithFilterMock).toHaveBeenCalledWith("Juan");
  });
});
