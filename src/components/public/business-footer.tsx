import Link from "next/link";

import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { SocialLinks } from "@/components/public/social-links";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { productName } from "@/constants/site";
import { cn } from "@/lib/utils";

type BusinessFooterProps = {
  slug: string;
  businessName: string;
  description: string;
  logoUrl?: string | null;
  logoLabel: string;
  bookingHref: string;
  whatsappHref: string | undefined;
  mapsHref: string;
  address?: string | null;
  instagramHref: string | null;
  facebookHref: string | null;
  tiktokHref: string | null;
};

export function BusinessFooter({
  slug,
  businessName,
  description,
  logoUrl,
  logoLabel,
  bookingHref,
  whatsappHref,
  mapsHref,
  address,
  instagramHref,
  facebookHref,
  tiktokHref,
}: BusinessFooterProps) {
  return (
    <footer className="border-t border-border/40 bg-background py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "relative flex size-9 sm:size-10 items-center justify-center overflow-hidden rounded-lg sm:rounded-xl border border-border/60 bg-background text-xs sm:text-sm font-bold text-foreground shadow-sm",
                  logoUrl ? "text-transparent" : ""
                )}
              >
                {logoUrl ? (
                  <OptimizedImage src={logoUrl} alt={`Logo de ${businessName}`} width={40} height={40} />
                ) : (
                  logoLabel
                )}
              </div>
              <span className="font-bold text-foreground text-sm sm:text-base">{businessName}</span>
            </div>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">Links rápidos</p>
            <div className="mt-3 sm:mt-4 flex flex-col gap-1.5">
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className="inline-flex min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Reservar turno
              </PublicTrackedLink>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contactar por WhatsApp
                </a>
              )}
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver ubicación
              </a>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm font-bold text-foreground">Contacto</p>
            <div className="mt-3 sm:mt-4 space-y-1.5">
              <p className="text-xs sm:text-sm text-muted-foreground">{address ?? "Dirección a definir"}</p>
              <SocialLinks
                variant="footer"
                instagramHref={instagramHref}
                facebookHref={facebookHref}
                tiktokHref={tiktokHref}
                businessName={businessName}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} {businessName.trim()}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end">
            <Link href="/privacidad" className="transition-colors hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/terminos" className="transition-colors hover:text-foreground">
              Términos
            </Link>
            <span className="inline-flex items-center gap-1.5 font-medium">
              Desarrollado con <ReservaYaLogo variant="isotype" size="sm" className="size-4" />
              <span className="font-bold text-foreground">{productName}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
