import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createPrivatePageMetadata } from "@/lib/seo/metadata";
import { SUBSCRIPTION_CARD_USD_PRICE } from "@/server/payments-domain";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { getSupabaseSubscriptionByBusinessId } from "@/server/supabase-store";

export const metadata: Metadata = createPrivatePageMetadata({
  title: "Pago de suscripción · ReservaYa",
  path: "/admin/subscription/success",
  description: "Confirmación del pago de suscripción.",
});

export const dynamic = "force-dynamic";

export default async function SubscriptionSuccessPage() {
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    redirect("/login");
  }

  const subscription = await getSupabaseSubscriptionByBusinessId(user.businessId);
  const isActive = subscription?.status === "active";

  return (
    <div className="landing-theme flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">{isActive ? "✅" : "⏳"}</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {isActive ? "¡Pago confirmado!" : "Estamos verificando tu pago"}
          </h1>
          <p className="text-muted-foreground">
            {isActive
              ? "Tu suscripción está activa. Ya podés usar el panel de gestión."
              : "Si el pago fue aprobado, la activación puede demorar unos segundos. Recargá esta página en un momento."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Detalles del plan</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan mensual</span>
              <span className="font-mono font-medium">USD {SUBSCRIPTION_CARD_USD_PRICE}</span>
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
