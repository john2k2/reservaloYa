import { VerticalSeoPage } from "@/components/seo/vertical-seo-page";
import { getSeoLandingPage } from "@/constants/seo-landing-pages";
import { FAQPageJsonLd, SoftwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata, siteConfig } from "@/lib/seo/metadata";

const page = getSeoLandingPage("agenda-online-peluquerias")!;
const url = `${siteConfig.url}/${page.slug}`;

export const metadata = createPageMetadata({
  title: page.metadataTitle,
  description: page.description,
  path: `/${page.slug}`,
  keywords: page.keywords,
});

export default function AgendaOnlinePeluqueriasPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={`${siteConfig.name} - ${page.title}`} description={page.description} url={url} />
      <FAQPageJsonLd faqs={page.faqs} />
      <VerticalSeoPage page={page} />
    </>
  );
}
