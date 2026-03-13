import { NextResponse } from "next/server";

import { getPublicBookingFlowData } from "@/server/queries/public";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const slug = searchParams.get("slug")?.trim();
  const serviceId = searchParams.get("serviceId")?.trim();
  const bookingDate = searchParams.get("date")?.trim();

  if (!slug || !serviceId || !bookingDate) {
    return NextResponse.json(
      { error: "Faltan parámetros para cargar horarios." },
      { status: 400 }
    );
  }

  const flow = await getPublicBookingFlowData({
    slug,
    serviceId,
    bookingDate,
  });

  if (!flow) {
    return NextResponse.json(
      { error: "No se encontró disponibilidad para este negocio." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    bookingDate: flow.bookingDate,
    slots: flow.slots,
  });
}
