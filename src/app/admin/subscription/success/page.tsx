import Link from "next/link";
import { redirect } from "next/navigation";

import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import { getBusinessSubscription } from "@/server/pocketbase-store";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { getMPPaymentInfo, isMercadoPagoConfigured } from "@/server/mercadopago";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
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
  const pb = await createPocketBaseServerClient();
  const refreshed = await refreshPocketBaseAuth(pb);

  if (!refreshed || !pb.authStore.record) {
    redirect("/login");
  }

  const businessId = Array.isArray(pb.authStore.record.business)
    ? pb.authStore.record.business[0]
    : pb.authStore.record.business;

  if (!businessId) {
    redirect("/login");
  }

  const params = await searchParams;
  const paymentId = params.payment_id;
  const paymentStatus = params.status;

  let paymentVerified = false;

  if (paymentStatus === "approved") {
    paymentVerified = true;
  } else if (paymentId) {
    try {
      if (isMercadoPagoConfigured()) {
        const paymentInfo = await getMPPaymentInfo(paymentId);
        if (paymentInfo && paymentInfo.status === "approved") {
          paymentVerified = true;
        }
      }
    } catch (err) {
      logger.error("Error verifying payment", err);
    }
  }

  if (!paymentVerified) {
    redirect("/admin/subscription/pay?error=payment_not_verified");
  }

  const subscription = await getBusinessSubscription(businessId as string);

  if (subscription) {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    await pb.collection("subscriptions").update(subscription.id, {
      status: "active",
      trialEndsAt: null,
      nextBillingDate: nextBillingDate.toISOString().split("T")[0],
    });
  } else {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    await pb.collection("subscriptions").create({
      businessId: businessId,
      status: "active",
      nextBillingDate: nextBillingDate.toISOString().split("T")[0],
    });
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);
  const formattedPrice = Math.round(arsPrice).toLocaleString("es-AR");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ¡Pago confirmado!
          </h1>
          <p className="text-muted-foreground">
            Tu suscripción está activa. Ya podés usar el panel de gestión.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Detalles del pago</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto pagado</span>
              <span className="font-medium">$ {formattedPrice} ARS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Próximo vencimiento</span>
              <span className="font-medium">En 30 días</span>
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
