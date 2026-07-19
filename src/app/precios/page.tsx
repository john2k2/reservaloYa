import {
  LandingPageShell,
  PricingSection,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { getSubscriptionArsPrice } from "@/server/payments-domain";

export const metadata = createPageMetadata({
  title: "Precio del sistema de turnos online",
  description:
    "Precio simple para usar ReservaYa en Argentina: 15 días gratis y un plan mensual sin permanencia, por transferencia en pesos o tarjeta.",
  path: "/precios",
});

export default async function PreciosPage() {
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  return (
    <LandingPageShell>
      <PricingSection arsPrice={arsPrice} headingLevel="h1" />
    </LandingPageShell>
  );
}
