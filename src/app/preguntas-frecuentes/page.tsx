import {
  LandingPageShell,
  FAQSection,
} from "@/components/landing";
import { landingSeoFaqs } from "@/constants/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { FAQPageJsonLd } from "@/lib/seo/json-ld";

export const metadata = createPageMetadata({
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las dudas más comunes sobre ReservaYa: qué es, para qué negocios sirve, si reemplaza WhatsApp y cómo reducir ausencias.",
  path: "/preguntas-frecuentes",
});

export default function PreguntasFrecuentesPage() {
  return (
    <LandingPageShell>
      <FAQPageJsonLd faqs={landingSeoFaqs} />
      <FAQSection />
    </LandingPageShell>
  );
}
