import { NextResponse } from "next/server";

import { buildCsv, buildCsvHeaders } from "@/server/admin-exports";
import { checkExportRateLimit } from "@/server/export-rate-limit";
import { getAdminCustomersDataWithFilter, getAdminShellData } from "@/server/queries/admin";

export async function GET(request: Request) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const rateLimit = checkExportRateLimit(shellData.businessId ?? shellData.userEmail);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas exportaciones. Esperá un momento e intentá de nuevo." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const customers = await getAdminCustomersDataWithFilter(query);

  if (!customers) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
