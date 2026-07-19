import {
  LandingPageShell,
  HowItWorksSection,
  SignatureMoment,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Cómo funciona el sistema de turnos online",
  description:
    "Descubrí cómo funciona ReservaYa: publicá servicios y horarios, compartí tu página y recibí turnos online sin coordinar por WhatsApp.",
  path: "/como-funciona",
});

export default function ComoFuncionaPage() {
  return (
    <LandingPageShell>
      <HowItWorksSection headingLevel="h1" />
      <SignatureMoment />
    </LandingPageShell>
  );
}
