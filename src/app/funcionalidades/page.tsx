import {
  LandingPageShell,
  FeaturesSection,
  BeforeAfterSection,
} from "@/components/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Funciones del sistema de turnos online",
  description:
    "Conocé las funciones de ReservaYa: reservas online, agenda, clientes y recordatorios automáticos para negocios de servicios en Argentina.",
  path: "/funcionalidades",
});

export default function FuncionalidadesPage() {
  return (
    <LandingPageShell>
      <FeaturesSection headingLevel="h1" />
      <BeforeAfterSection />
    </LandingPageShell>
  );
}
