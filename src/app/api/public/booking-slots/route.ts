import { NextResponse } from "next/server";

import { getPublicBookingFlowData } from "@/server/queries/public";
import { consumeRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

const PUBLIC_BOOKING_SLOTS_MAX = 100;
const PUBLIC_BOOKING_SLOTS_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  try {
    const identifier = getRateLimitIdentifier(request.headers, "anonymous");
    const rateLimit = await consumeRateLimit({
      bucket: "public-booking-slots",
      identifier,
      max: PUBLIC_BOOKING_SLOTS_MAX,
      windowMs: PUBLIC_BOOKING_SLOTS_WINDOW_MS,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

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
