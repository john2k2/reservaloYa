import { Facebook, Instagram } from "lucide-react";

import { TikTokIcon, WhatsAppIcon } from "@/components/icons";

export type SocialHref = string | null;

export type SocialLinksVariant = "hero-desktop" | "hero-mobile" | "footer";

type SocialLinksProps = {
  variant: SocialLinksVariant;
  instagramHref: SocialHref;
  facebookHref: SocialHref;
  tiktokHref: SocialHref;
  whatsappHref?: string;
  /** Requerido para `variant="footer"`: sufija los aria-label ("Abrir Instagram de {businessName}"). */
  businessName?: string;
};

const WRAPPER_CLASS_NAME: Record<SocialLinksVariant, string> = {
  "hero-desktop": "hidden flex-wrap items-center gap-2 lg:flex",
  "hero-mobile": "flex flex-wrap items-center gap-2 lg:hidden",
  footer: "flex flex-wrap gap-2",
};

const LINK_CLASS_NAME: Record<SocialLinksVariant, string> = {
  "hero-desktop":
    "rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
  "hero-mobile":
    "rounded-full border border-border/60 bg-background p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
  footer:
    "inline-flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

const ICON_CLASS_NAME: Record<SocialLinksVariant, string> = {
  "hero-desktop": "size-4",
  "hero-mobile": "size-4",
  footer: "size-3.5 sm:size-4",
};

/**
 * Links de redes sociales (Instagram/Facebook/TikTok/WhatsApp) de la página
 * pública de un negocio, en sus 3 variantes: header del hero en desktop,
 * header del hero en mobile, y columna de contacto del footer. Cada variante
 * difiere en clases responsive, estilo del botón y aria-labels. El footer no
 * incluye WhatsApp (ahí se muestra como link de texto en "Links rápidos") y
 * sufija los aria-label con el nombre del negocio.
 */
export function SocialLinks({
  variant,
  instagramHref,
  facebookHref,
  tiktokHref,
  whatsappHref,
  businessName,
}: SocialLinksProps) {
  const isFooter = variant === "footer";
  const hasAnyLink = Boolean(instagramHref || facebookHref || tiktokHref || whatsappHref);

  if (variant === "hero-mobile" && !hasAnyLink) {
    return null;
  }

  const linkClassName = LINK_CLASS_NAME[variant];
  const iconClassName = ICON_CLASS_NAME[variant];
  const ariaHidden = isFooter ? "true" : undefined;

  return (
    <div className={WRAPPER_CLASS_NAME[variant]}>
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isFooter ? `Abrir Instagram de ${businessName}` : "Abrir Instagram"}
          className={linkClassName}
        >
          <Instagram className={iconClassName} aria-hidden={ariaHidden} />
        </a>
      )}
      {facebookHref && (
        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isFooter ? `Abrir Facebook de ${businessName}` : "Abrir Facebook"}
          className={linkClassName}
        >
          <Facebook className={iconClassName} aria-hidden={ariaHidden} />
        </a>
      )}
      {tiktokHref && (
        <a
          href={tiktokHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isFooter ? `Abrir TikTok de ${businessName}` : "Abrir TikTok"}
          className={linkClassName}
        >
          <TikTokIcon className={iconClassName} aria-hidden={ariaHidden} />
        </a>
      )}
      {!isFooter && whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className={linkClassName}
        >
          <WhatsAppIcon className={iconClassName} />
        </a>
      )}
    </div>
  );
}
