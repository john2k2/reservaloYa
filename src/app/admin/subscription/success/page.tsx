import Link from "next/link";
import { redirect } from "next/navigation";

import { getBlueDollarRate } from "@/lib/dollar-rate";
import { getMPPaymentInfo, isMercadoPagoConfigured } from "@/server/mercadopago";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { getSupabaseSubscriptionByBusinessId } from "@/server/supabase-store";
import { createLogger } from "@/server/logger";

const logger = createLogger("Subscription Success");

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    collection_id?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
  }>;
}

export default async function SubscriptionSuccessPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    redirect("/login");
  }

  const params = await searchParams;
  const paymentId = params.payment_id;
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);
  const formattedPrice = Math.round(arsPrice).toLocaleString("es-AR");

  const subscription = await getSupabaseSubscriptionByBusinessId(user.businessId);
  let paymentVerifiedByMp = false;

  if (paymentId && isMercadoPagoConfigured()) {
    try {
      const paymentInfo = await getMPPaymentInfo(paymentId);
      const amountMatches =
        paymentInfo?.transactionAmount != null &&
        Math.abs(paymentInfo.transactionAmount - arsPrice) < 0.01;

      if (
        paymentInfo?.status === "approved" &&
        paymentInfo.externalReference === user.businessId &&
        paymentInfo.currencyId === "ARS" &&
        amountMatches
      ) {
        paymentVerifiedByMp = true;
      }
    } catch (err) {
      logger.error("Error verifying payment", err);
    }
  }

  const isActive = subscription?.status === "active";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">{isActive ? "✅" : "⏳"}</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isActive ? "¡Pago confirmado!" : "Estamos verificando tu pago"}
          </h1>
          <p className="text-muted-foreground">
            {isActive
              ? "Tu suscripción está activa. Ya podés usar el panel de gestión."
              : "Si el pago fue aprobado, el webhook de Mercado Pago va a activar tu suscripción en unos instantes."}
          </p>
          {!isActive && paymentId && !paymentVerifiedByMp ? (
            <p className="text-sm text-muted-foreground">
              No activamos la cuenta desde esta pantalla porque no pudimos validar el pago con Mercado Pago.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Detalles del pago</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto pagado</span>
              <span className="font-medium">$ {formattedPrice} ARS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-medium">{isActive ? "Activa" : "Pendiente"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/dashboard"
            className="block w-full rounded-lg bg-foreground px-4 py-3 text-center text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Ir al panel de gestión
          </Link>
        </div>
      </div>
    </div>
  );
}
