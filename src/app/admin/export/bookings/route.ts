import { NextResponse } from "next/server";

import { buildCsv, buildCsvHeaders } from "@/server/admin-exports";
import { getAdminBookingsData, getAdminShellData } from "@/server/queries/admin";

export async function GET(request: Request) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    status: searchParams.get("status")?.trim() ?? "",
    date: searchParams.get("date")?.trim() ?? "",
    q: searchParams.get("q")?.trim() ?? "",
  };
  const bookings = await getAdminBookingsData(filters);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${shellData.businessSlug}-agenda-${today}.csv`;
  const csv = buildCsv(
    ["Fecha", "Hora", "Cliente", "Telefono", "Servicio", "Estado", "Notas"],
    bookings.map((booking) => [
      booking.bookingDate,
      booking.startTime,
      booking.customerName,
      booking.phone,
      booking.serviceName,
      booking.statusLabel,
      booking.notes,
    ])
  );

  return new NextResponse(csv, {
    status: 200,
    headers: buildCsvHeaders(filename),
  });
}
