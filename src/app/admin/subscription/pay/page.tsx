import { redirect } from "next/navigation";

import { getAdminShellData } from "@/server/queries/admin";
import { getBlueDollarRate } from "@/lib/dollar-rate";

const USD_PRICE = 17;

export default async function SubscriptionPayPage() {
  const shellData = await getAdminShellData();

  if (!shellData) {
    redirect("/login");
  }

  if (!shellData.subscriptionExpired) {
    redirect("/admin/dashboard");
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = blueRate ? USD_PRICE * blueRate : USD_PRICE * 1435;
  const formattedPrice = Math.round(arsPrice).toLocaleString("es-AR");

  async function handlePayAction() {
    "use server";
    
    // This would be called by the form to generate the payment link
    // For now redirect to payment
    redirect("/api/payments/create-preference");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">💳</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Abonar tu suscripción
          </h1>
          <p className="text-muted-foreground">
            {shellData?.businessName
              ? `${shellData.businessName}`
              : "Tu negocio"}{" "}
            - $ {formattedPrice} ARS por mes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Resumen</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan Mensual</span>
              <span className="font-medium">$ {formattedPrice} ARS</span>
            </div>
          </div>

          <form action={handlePayAction}>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#00B1EA] px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#0096D6]"
            >
              Pagar con MercadoPago
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground">
          Pago procesado por MercadoPago. Después de pagar, tu acceso se reactivará automáticamente.
        </p>
      </div>
    </div>
  );
}
