import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getAdminShellData } from "@/server/queries/admin";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { generateCsrfToken } from "@/lib/csrf";
import { SubscriptionPayButton } from "./subscription-pay-button";

export const metadata: Metadata = {
  title: "Abonar suscripción · ReservaYa",
  description: "Reactivá tu acceso al panel de ReservaYa abonando la suscripción mensual.",
  robots: { index: false, follow: false },
};

export default async function SubscriptionPayPage() {
  const shellData = await getAdminShellData();

  if (!shellData) {
    redirect("/login");
  }

  if (!shellData.subscriptionExpired) {
    redirect("/admin/dashboard");
  }

  const user = await getAuthenticatedSupabaseUser();

  if (!user) {
    redirect("/login");
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);
  const formattedPrice = Math.round(arsPrice).toLocaleString("es-AR");
  const csrfToken = generateCsrfToken(user.id);

  return (
    <div className="landing-theme flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">💳</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
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
              <span className="font-mono font-medium">$ {formattedPrice} ARS</span>
            </div>
          </div>

          <SubscriptionPayButton
            csrfToken={csrfToken}
            label="Pagar con MercadoPago"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Pago procesado por MercadoPago. Después de pagar, tu acceso se reactivará automáticamente.
        </p>
      </div>
    </div>
  );
}
