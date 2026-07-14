import { VerticalSeoPage } from "@/components/seo/vertical-seo-page";
import { getSeoLandingPage } from "@/constants/seo-landing-pages";
import { createPageMetadata } from "@/lib/seo/metadata";

const page = getSeoLandingPage("sistema-reservas-centros-estetica")!;

export const metadata = createPageMetadata({
  title: page.metadataTitle,
  description: page.description,
  path: `/${page.slug}`,
  keywords: page.keywords,
});

export default function SistemaReservasCentrosEsteticaPage() {
  return <VerticalSeoPage page={page} />;
}
