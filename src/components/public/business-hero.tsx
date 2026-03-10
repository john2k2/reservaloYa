"use client";

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
          className="inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Web
        </a>
      )}
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          IG
        </a>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-full border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
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
    <section className="px-4 pb-8 pt-3 sm:px-6 sm:pb-14 sm:pt-6 lg:pb-20 lg:pt-8" style={heroStyle}>
      <div className="mx-auto max-w-6xl">
        {/* Header con logo y redes */}
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-border/60 bg-background text-xs sm:text-sm font-bold text-foreground shadow-sm",
                profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
              )}
              role={profile.logoUrl ? "img" : undefined}
              aria-label={profile.logoUrl ? `Logo de ${businessName}` : undefined}
              style={logoStyle}
            >
              {profile.logoUrl ? "" : logoLabel}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {profile.badge}
              </p>
              <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-semibold text-foreground">{businessName}</p>
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

        <div className="grid gap-6 py-4 sm:py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:py-10">
          <div>
            {/* Badges */}
            <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground shadow-sm">
                <Star className="size-3 fill-current" style={{ color: profile.accent }} />
                Turnos online claros
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] sm:text-xs font-medium text-muted-foreground shadow-sm">
                <Clock3 className="size-3" style={{ color: profile.accent }} />
                Reserva en menos de 1 minuto
              </div>
            </div>

            {/* Headline */}
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: profile.accent }}>
              {profile.eyebrow}
            </p>
            <h1 className="mt-2 sm:mt-4 max-w-3xl text-2xl sm:text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {profile.headline}
            </h1>
            <p className="mt-3 sm:mt-6 max-w-2xl text-sm sm:text-lg leading-relaxed sm:leading-8 text-muted-foreground">
              {profile.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-5 sm:mt-8 flex flex-col gap-2.5 sm:flex-row">
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 sm:h-12 w-full rounded-full px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
                )}
                style={{ backgroundColor: profile.accent, borderColor: profile.accent }}
              >
                <Calendar className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                {profile.primaryCta}
              </PublicTrackedLink>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 sm:h-12 w-full rounded-full px-6 sm:px-8 text-sm sm:text-base transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95 sm:w-auto"
                )}
              >
                <WhatsAppIcon className="mr-1.5 sm:mr-2 size-4 sm:size-5" />
                {profile.secondaryCta}
              </a>
            </div>

            {/* Info Cards - Mobile Scrollable */}
            <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 sm:hidden">
              <div className="min-w-[140px] flex-1 snap-start rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="size-3" style={{ color: profile.accent }} />
                  Próximo turno
                </div>
                <p className="mt-2 text-base font-bold text-foreground">{nextAvailableSlot.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{nextAvailableSlot.detail}</p>
              </div>
              <div className="min-w-[140px] flex-1 snap-start rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Scissors className="size-3" style={{ color: profile.accent }} />
                  Servicios
                </div>
                <p className="mt-2 text-base font-bold text-foreground">{servicesCount} opciones</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Precios visibles</p>
              </div>
              <div className="min-w-[140px] flex-1 snap-start rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3" style={{ color: profile.accent }} />
                  Horarios
                </div>
                <p className="mt-2 text-base font-bold text-foreground">
                  {firstActiveDay ? firstActiveDay.dayLabel : "Consultar"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {firstActiveDay ? firstActiveDay.hoursLabel : "Agenda activa"}
                </p>
              </div>
            </div>

            {/* Trust Points */}
            <div className="mt-4 sm:mt-8 flex flex-wrap gap-2">
              {profile.trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm"
                >
                  <CheckCircle2 className="size-3.5 sm:size-4" style={{ color: profile.accent }} />
                  {point}
                </div>
              ))}
            </div>

            {/* Info Cards - Desktop */}
            <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Próximo turno
                </p>
                <p className="mt-2 text-base sm:text-lg font-bold text-foreground">{nextAvailableSlot.title}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{nextAvailableSlot.detail}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor claro
                </p>
                <p className="mt-2 text-base sm:text-lg font-bold text-foreground">{startingPriceLabel}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Precios visibles antes de reservar</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Oferta real
                </p>
                <p className="mt-2 text-base sm:text-lg font-bold text-foreground">{servicesCount} servicios</p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Opciones claras con duración definida</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ubicación
                </p>
                <p className="mt-2 text-base sm:text-lg font-bold text-foreground">{shortAddressLabel}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Con acceso rápido al mapa</p>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image & Cards */}
          <div className="rounded-2xl sm:rounded-[2rem] border border-border/60 bg-card/90 p-4 sm:p-6 shadow-xl shadow-black/5 backdrop-blur">
            {/* Hero Image - Aspect ratio más bajo en móvil */}
            <div
              className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-cover bg-center"
              role="img"
              aria-label={profile.heroImageAlt ?? `Portada de ${businessName}`}
              style={heroImageStyle}
            />

            {/* Feature Cards - Grid 2 cols en móvil también */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-background p-3 sm:p-5">
                <Sparkles aria-hidden="true" className="size-4 sm:size-5" style={{ color: profile.accent }} />
                <p className="mt-3 text-xs sm:text-sm font-medium text-muted-foreground">Experiencia</p>
                <p className="mt-1 text-sm sm:text-base font-semibold text-foreground">
                  Reserva clara desde el primer vistazo
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3 sm:p-5">
                <ShieldCheck aria-hidden="true" className="size-4 sm:size-5" style={{ color: profile.accent }} />
                <p className="mt-3 text-xs sm:text-sm font-medium text-muted-foreground">Gestión</p>
                <p className="mt-1 text-sm sm:text-base font-semibold text-foreground">
                  Link directo para cambiar o cancelar
                </p>
              </div>
            </div>

            {/* Testimonial Card */}
            {highlightedTestimonial ? (
              <div className="mt-3 sm:mt-4 rounded-xl border border-border/60 bg-background p-3 sm:p-5">
                <div className="flex items-center gap-2">
                  <Quote aria-hidden="true" className="size-3.5 sm:size-4" style={{ color: profile.accent }} />
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Lo primero que perciben</p>
                </div>
                <p className="mt-2 text-sm sm:text-base font-semibold leading-snug sm:leading-7 text-foreground">
                  &ldquo;{highlightedTestimonial.quote}&rdquo;
                </p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  {highlightedTestimonial.author} · {highlightedTestimonial.detail}
                </p>
              </div>
            ) : null}

            {/* Location & Hours */}
            <div className="mt-3 sm:mt-4 rounded-xl border border-border/60 bg-background p-3 sm:p-5">
              <div className="flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: profile.accent }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-foreground">{shortAddressLabel}</p>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex text-xs sm:text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-3 sm:mt-4 rounded-xl border border-border/60 bg-background p-3 sm:p-5">
              <div className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-3.5 sm:size-4" style={{ color: profile.accent }} />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Horarios de atención</p>
              </div>
              <div className="mt-2 space-y-1">
                {weeklyHours.slice(0, 4).map((slot) => (
                  <div
                    key={slot.dayLabel}
                    className="flex items-center justify-between gap-2 text-xs sm:text-sm"
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
