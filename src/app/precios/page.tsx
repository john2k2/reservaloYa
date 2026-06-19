import {
  LandingPageShell,
  PricingSection,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { getSubscriptionArsPrice } from "@/server/payments-domain";

export const metadata = createPageMetadata({
  title: "Precios de ReservaYa",
  description:
    "Plan simple y accesible para negocios de servicios en Argentina. Pagá en pesos argentinos sin sorpresas.",
  path: "/precios",
});

export default async function PreciosPage() {
  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  return (
    <LandingPageShell>
      <PricingSection arsPrice={arsPrice} />
    </LandingPageShell>
  );
}
