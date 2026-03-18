import Link from "next/link";

import { productName } from "@/constants/site";
import { getAdminShellData } from "@/server/queries/admin";
import { getBlueDollarRate } from "@/lib/dollar-rate";

const USD_PRICE = 17;

export default async function SubscriptionExpiredPage() {
  const shellData = await getAdminShellData();

  const blueRate = await getBlueDollarRate();
  const arsPrice = blueRate ? USD_PRICE * blueRate : USD_PRICE * 1450;
  const formattedPrice = Math.round(arsPrice).toLocaleString("es-AR");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">📅</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tu período de prueba terminó
          </h1>
          <p className="text-muted-foreground">
            {shellData?.businessName
              ? `${shellData.businessName} tuvo 15 días gratis.`
              : "Tu negocio tuvo 15 días gratis."}{" "}
            Aboná tu suscripción mensual para seguir usando el panel de gestión.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Plan Mensual</p>
            <p className="text-3xl font-bold">${formattedPrice} <span className="text-sm font-normal text-muted-foreground">ARS/mes</span></p>
          </div>

          <div className="space-y-2 text-sm text-left">
            <p className="font-medium">Incluye:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Acceso completo al panel de gestión</li>
              <li>✓ Página pública de reservas</li>
              <li>✓ Recordatorios automáticos por email</li>
              <li>✓ Soporte por WhatsApp</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/subscription/pay"
            className="block w-full rounded-lg bg-foreground px-4 py-3 text-center text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Ir a pagar
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Cerrar sesión
            </button>
          </form>

          <p className="text-xs text-muted-foreground">
            ¿Tenés preguntas? Escribinos a{" "}
            <a href="mailto:soporte@reservaya.app" className="underline">
              soporte@reservaya.app
            </a>
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 text-center">
        <p className="text-xs text-muted-foreground">
          powered by <span className="font-medium">{productName}</span>
        </p>
      </div>
    </div>
  );
}
