import { NextResponse } from "next/server";

import { getPublicBookingFlowData } from "@/server/queries/public";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const slug = searchParams.get("slug")?.trim();
    const serviceId = searchParams.get("serviceId")?.trim();
    const bookingDate = searchParams.get("date")?.trim();

    if (!slug || !serviceId || !bookingDate) {
      return NextResponse.json(
        { error: "Faltan parametros para cargar horarios." },
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
        { error: "No se encontro disponibilidad para este negocio." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bookingDate: flow.bookingDate,
      slots: flow.slots,
    });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los horarios en este momento." },
      { status: 503 }
    );
  }
}
