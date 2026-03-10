import type { CSSProperties } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  Facebook,
  Globe,
  Instagram,
  MapPin,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { WhatsAppIcon, TikTokIcon } from "@/components/icons";
import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type SocialHref = string | null;

type BusinessHeroProps = {
  slug: string;
  businessName: string;
  profile: {
    accent: string;
    accentSoft: string;
    surfaceTint: string;
    logoUrl?: string | null;
    logoLabel?: string | null;
    heroImageUrl?: string | null;
    heroImageAlt?: string | null;
    badge: string;
    eyebrow: string;
    headline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    trustPoints: string[];
  };
  bookingHref: string;
  whatsappHref: string;
  websiteHref: SocialHref;
  instagramHref: SocialHref;
  facebookHref: SocialHref;
  tiktokHref: SocialHref;
  mapsHref: string;
  logoLabel: string;
  nextAvailableSlot: { title: string; detail: string };
  servicesCount: number;
  startingPriceLabel: string;
  shortAddressLabel: string;
  firstActiveDay: { dayLabel: string; hoursLabel: string } | null;
  weeklyHours: Array<{ dayLabel: string; hoursLabel: string }>;
  highlightedTestimonial:
    | {
        quote: string;
        author: string;
        detail: string;
      }
    | null;
};

function SocialLinksDesktop({
  websiteHref,
  instagramHref,
  facebookHref,
  tiktokHref,
  whatsappHref,
}: {
  websiteHref: SocialHref;
  instagramHref: SocialHref;
  facebookHref: SocialHref;
  tiktokHref: SocialHref;
  whatsappHref: string;
}) {
  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex">
      {websiteHref && (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Globe className="size-4" />
        </a>
      )}
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Instagram className="size-4" />
        </a>
      )}
      {facebookHref && (
        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Facebook className="size-4" />
        </a>
      )}
      {tiktokHref && (
        <a
          href={tiktokHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <TikTokIcon className="size-4" />
        </a>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <WhatsAppIcon className="size-4" />
      </a>
    </div>
  );
}

function SocialLinksMobile({
  websiteHref,
  instagramHref,
  whatsappHref,
}: {
  websiteHref: SocialHref;
  instagramHref: SocialHref;
  whatsappHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 lg:hidden">
      {websiteHref && (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-3 text-xs")}
        >
          Web
        </a>
      )}
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-3 text-xs")}
        >
          IG
        </a>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-3 text-xs")}
      >
        WhatsApp
      </a>
    </div>
  );
}

export function BusinessHero({
  slug,
  businessName,
  profile,
  bookingHref,
  whatsappHref,
  websiteHref,
  instagramHref,
  facebookHref,
  tiktokHref,
  mapsHref,
  logoLabel,
  nextAvailableSlot,
  servicesCount,
  startingPriceLabel,
  shortAddressLabel,
  firstActiveDay,
  weeklyHours,
  highlightedTestimonial,
}: BusinessHeroProps) {
  const heroStyle = {
    background: `radial-gradient(circle at top, ${profile.accentSoft} 0%, ${profile.surfaceTint} 48%, transparent 100%)`,
  } satisfies CSSProperties;

  const logoStyle = profile.logoUrl
    ? ({
        backgroundImage: `url(${profile.logoUrl})`,
      } satisfies CSSProperties)
    : undefined;

  const heroImageStyle = profile.heroImageUrl
    ? ({
        backgroundImage: `url(${profile.heroImageUrl})`,
      } satisfies CSSProperties)
    : undefined;

  return (
    <section className="px-4 pb-14 pt-4 sm:px-6 sm:pb-20 sm:pt-8" style={heroStyle}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-sm font-bold text-foreground shadow-sm",
                profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
              )}
              role={profile.logoUrl ? "img" : undefined}
              aria-label={profile.logoUrl ? `Logo de ${businessName}` : undefined}
              style={logoStyle}
            >
              {profile.logoUrl ? "" : logoLabel}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {profile.badge}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{businessName}</p>
            </div>
          </div>

          <SocialLinksDesktop
            websiteHref={websiteHref}
            instagramHref={instagramHref}
            facebookHref={facebookHref}
            tiktokHref={tiktokHref}
            whatsappHref={whatsappHref}
          />
          <SocialLinksMobile
            websiteHref={websiteHref}
            instagramHref={instagramHref}
            whatsappHref={whatsappHref}
          />
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:py-10">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-sm">
                <Star className="size-3.5 fill-current" style={{ color: profile.accent }} />
                Turnos online claros
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Clock3 className="size-3.5" style={{ color: profile.accent }} />
                Reserva en menos de 1 minuto
              </div>
            </div>

            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: profile.accent }}>
              {profile.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {profile.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {profile.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-14 w-full rounded-full px-10 text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
                )}
                style={{ backgroundColor: profile.accent, borderColor: profile.accent }}
              >
                <Calendar className="mr-2 size-5" />
                {profile.primaryCta}
              </PublicTrackedLink>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-14 w-full rounded-full px-10 text-base transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95 sm:w-auto"
                )}
              >
                <WhatsAppIcon className="mr-2 size-5" />
                {profile.secondaryCta}
              </a>
            </div>

            <div className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pb-1 sm:hidden">
              <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Calendar className="size-3.5" style={{ color: profile.accent }} />
                  Próximo turno
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">{nextAvailableSlot.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextAvailableSlot.detail}</p>
              </div>
              <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Scissors className="size-3.5" style={{ color: profile.accent }} />
                  Servicios activos
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">{servicesCount} opciones</p>
                <p className="mt-1 text-sm text-muted-foreground">Con precio y duración visibles</p>
              </div>
              <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Clock className="size-3.5" style={{ color: profile.accent }} />
                  Agenda visible
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {firstActiveDay ? firstActiveDay.dayLabel : "Agenda activa"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {firstActiveDay ? firstActiveDay.hoursLabel : "Horarios listos para reservar"}
                </p>
              </div>
              <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <MapPin className="size-3.5" style={{ color: profile.accent }} />
                  Ubicación
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">{shortAddressLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Con acceso rápido al mapa</p>
              </div>
              <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Star className="size-3.5 fill-current" style={{ color: profile.accent }} />
                  Valor claro
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">{startingPriceLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Sin sorpresas al reservar</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {profile.trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                >
                  <CheckCircle2 className="size-4" style={{ color: profile.accent }} />
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Próximo turno
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{nextAvailableSlot.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextAvailableSlot.detail}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Valor claro
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{startingPriceLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Precios visibles antes de reservar</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Oferta real
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{servicesCount} servicios activos</p>
                <p className="mt-1 text-sm text-muted-foreground">Opciones claras con duración definida</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Próximo ritmo
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {firstActiveDay ? firstActiveDay.dayLabel : "Agenda activa"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {firstActiveDay ? firstActiveDay.hoursLabel : "Consulta horarios visibles"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Ubicación
                </p>
                <p className="mt-3 text-lg font-bold text-foreground">{shortAddressLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Con acceso rápido al mapa</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur">
            <div
              className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-cover bg-center"
              role="img"
              aria-label={profile.heroImageAlt ?? `Portada de ${businessName}`}
              style={heroImageStyle}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background p-5">
                <Sparkles aria-hidden="true" className="size-5" style={{ color: profile.accent }} />
                <p className="mt-4 text-sm font-medium text-muted-foreground">Experiencia</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Reserva clara desde el primer vistazo
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background p-5">
                <ShieldCheck aria-hidden="true" className="size-5" style={{ color: profile.accent }} />
                <p className="mt-4 text-sm font-medium text-muted-foreground">Gestión</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  Link directo para cambiar o cancelar
                </p>
              </div>
            </div>

            {highlightedTestimonial ? (
              <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
                <div className="flex items-center gap-2">
                  <Quote aria-hidden="true" className="size-4" style={{ color: profile.accent }} />
                  <p className="text-sm font-medium text-muted-foreground">Lo primero que perciben</p>
                </div>
                <p className="mt-3 text-base font-semibold leading-7 text-foreground">
                  &ldquo;{highlightedTestimonial.quote}&rdquo;
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {highlightedTestimonial.author} · {highlightedTestimonial.detail}
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" style={{ color: profile.accent }} />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{shortAddressLabel}</p>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4" style={{ color: profile.accent }} />
                <p className="text-sm font-medium text-muted-foreground">Horarios de atención</p>
              </div>
              <div className="mt-3 space-y-2">
                {weeklyHours.slice(0, 4).map((slot) => (
                  <div
                    key={slot.dayLabel}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-medium text-foreground">{slot.dayLabel}</span>
                    <span className="text-muted-foreground">{slot.hoursLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
