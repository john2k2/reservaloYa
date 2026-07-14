import {
  LandingPageShell,
  FeaturesSection,
  BeforeAfterSection,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Funcionalidades",
  description:
    "Descubrí todo lo que ReservaYa puede hacer por tu negocio: reservas online, recordatorios automáticos, agenda simple y operación sin caos.",
  path: "/funcionalidades",
});

export default function FuncionalidadesPage() {
  return (
    <LandingPageShell>
      <FeaturesSection />
      <BeforeAfterSection />
    </LandingPageShell>
  );
}
