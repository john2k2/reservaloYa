import { NextResponse } from "next/server";
import { z } from "zod";

import { buildCsv, buildCsvHeaders } from "@/server/admin-exports";
import { getAdminBookingsData, getAdminShellData } from "@/server/queries/admin";

const bookingExportFiltersSchema = z.object({
  status: z.string().max(50).default(""),
  date: z.string().max(10).default(""),
  q: z.string().max(200).default(""),
});

export async function GET(request: Request) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = bookingExportFiltersSchema.safeParse({
    status: searchParams.get("status")?.trim() ?? "",
    date: searchParams.get("date")?.trim() ?? "",
    q: searchParams.get("q")?.trim() ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  const filters = parsed.data;
  const bookings = await getAdminBookingsData(filters);

  if (!bookings) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
