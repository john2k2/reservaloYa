import { NextResponse } from "next/server";

import { buildCsv, buildCsvHeaders } from "@/server/admin-exports";
import { getAdminCustomersDataWithFilter, getAdminShellData } from "@/server/queries/admin";

export async function GET(request: Request) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const customers = await getAdminCustomersDataWithFilter(query);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${shellData.businessSlug}-clientes-${today}.csv`;
  const csv = buildCsv(
    ["Nombre", "Telefono", "Email", "Notas", "Cantidad de turnos", "Ultimo turno"],
    customers.map((customer) => [
      customer.fullName,
      customer.phone,
      customer.email,
      customer.notes,
      customer.bookingsCount,
      customer.lastBookingDate ?? "",
    ])
  );

  return new NextResponse(csv, {
    status: 200,
    headers: buildCsvHeaders(filename),
  });
}
