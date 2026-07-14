import {
  LandingPageShell,
  HowItWorksSection,
  SignatureMoment,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Cómo funciona",
  description:
    "Tres pasos simples: mostrá un negocio en vivo, probá el panel de administración y empezá a cobrar con tu sistema de turnos online.",
  path: "/como-funciona",
});

export default function ComoFuncionaPage() {
  return (
    <LandingPageShell>
      <HowItWorksSection />
      <SignatureMoment />
    </LandingPageShell>
  );
}
