import { NextResponse } from "next/server";

/**
 * Legacy: MercadoPago ya no se usa para cobrar la suscripción de ReservaYa.
 * Métodos vigentes: transferencia ARS + Polar (tarjeta USD).
 * MercadoPago OAuth por negocio sigue activo para cobro de turnos.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "mp_subscription_disabled",
      message:
        "MercadoPago ya no está disponible para suscripciones. Usá transferencia o tarjeta (Polar).",
    },
    { status: 410 }
  );
}
