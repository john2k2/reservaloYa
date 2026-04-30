"use client";

import type { CSSProperties } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  Facebook,
  Instagram,
  MapPin,
  Quote,
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
  whatsappHref: string | undefined;
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
  highlightedTestimonial:
    | {
        quote: string;
        author: string;
        detail: string;
      }
    | null;
};

function SocialLinksDesktop({
  instagramHref,
  facebookHref,
  tiktokHref,
  whatsappHref,
}: {
  instagramHref: SocialHref;
  facebookHref: SocialHref;
  tiktokHref: SocialHref;
  whatsappHref: string | undefined;
}) {
  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex">
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir Instagram"
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
          aria-label="Abrir Facebook"
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
          aria-label="Abrir TikTok"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <TikTokIcon className="size-4" />
        </a>
      )}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className="rounded-full bg-background/80 p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <WhatsAppIcon className="size-4" />
        </a>
      )}
    </div>
  );
}

function SocialLinksMobile({
  instagramHref,
}: {
  instagramHref: SocialHref;
}) {
  if (!instagramHref) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 lg:hidden">
      {instagramHref && (
        <a
          href={instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border/60 bg-background px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Instagram
        </a>
      )}
    </div>
  );
}

export function BusinessHero({
  slug,
  businessName,
  profile,
  bookingHref,
  whatsappHref,
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
  highlightedTestimonial,
}: BusinessHeroProps) {
  const heroStyle = {
    background: `radial-gradient(circle at top, ${profile.accentSoft} 0%, ${profile.surfaceTint} 48%, transparent 100%)`,
  } satisfies CSSProperties;

  const logoStyle = profile.logoUrl
    ? ({ backgroundImage: `url(${profile.logoUrl})` } satisfies CSSProperties)
    : undefined;

  const heroImageStyle = profile.heroImageUrl
    ? ({ backgroundImage: `url(${profile.heroImageUrl})` } satisfies CSSProperties)
    : undefined;

  return (
    <section className="px-4 pb-8 pt-2 sm:px-6 sm:pb-12 sm:pt-5 lg:pb-16 lg:pt-8" style={heroStyle}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-xs font-bold text-foreground shadow-sm sm:size-12 sm:rounded-2xl sm:text-sm",
                profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
              )}
              role={profile.logoUrl ? "img" : undefined}
              aria-label={profile.logoUrl ? `Logo de ${businessName}` : undefined}
              style={logoStyle}
            >
              {profile.logoUrl ? "" : logoLabel}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                {profile.badge}
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground sm:mt-1 sm:text-lg">{businessName}</p>
            </div>
          </div>

          <SocialLinksDesktop
            instagramHref={instagramHref}
            facebookHref={facebookHref}
            tiktokHref={tiktokHref}
            whatsappHref={whatsappHref}
          />
          <SocialLinksMobile instagramHref={instagramHref} />
        </div>

        <div className="grid gap-5 py-3 sm:py-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:py-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm sm:text-xs">
                <Star className="size-3 fill-current" style={{ color: profile.accent }} />
                Turnos online claros
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm sm:text-xs">
                <Clock3 className="size-3" style={{ color: profile.accent }} />
                Reserva en menos de 1 minuto
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: profile.accent }}>
              {profile.eyebrow}
            </p>
            <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
              {profile.headline}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              {profile.description}
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row">
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 w-full rounded-full px-6 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.02] sm:w-auto sm:px-8 sm:text-base"
                )}
                style={{ backgroundColor: profile.accent, borderColor: profile.accent }}
              >
                <Calendar className="mr-1.5 size-4 sm:mr-2 sm:size-5" />
                {profile.primaryCta}
              </PublicTrackedLink>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:h-12 sm:px-8 sm:text-base"
                  )}
                >
                  <WhatsAppIcon className="mr-1.5 size-4 sm:mr-2 sm:size-5" />
                  <span className="sm:hidden">Consultar por WhatsApp</span>
                  <span className="hidden sm:inline">{profile.secondaryCta}</span>
                </a>
              )}
            </div>

            <div
              className="relative mt-5 aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-cover bg-center shadow-sm sm:hidden"
              role="img"
              aria-label={profile.heroImageAlt ?? `Portada de ${businessName}`}
              style={heroImageStyle}
            />

            <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="size-3.5" style={{ color: profile.accent }} />
                  Próximo turno
                </div>
                <p className="mt-2 text-lg font-bold text-foreground">{nextAvailableSlot.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{nextAvailableSlot.detail}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3.5" style={{ color: profile.accent }} />
                  Precios desde
                </div>
                <p className="mt-2 text-lg font-bold text-foreground">{startingPriceLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {firstActiveDay ? `${firstActiveDay.dayLabel} · ${firstActiveDay.hoursLabel}` : "Agenda activa"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-8">
              {profile.trustPoints.map((point, index) => (
                <div
                  key={point}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm",
                    index > 1 ? "hidden sm:flex" : ""
                  )}
                >
                  <CheckCircle2 className="size-3.5 sm:size-4" style={{ color: profile.accent }} />
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Próximo turno</p>
                <p className="mt-2 text-base font-bold text-foreground sm:text-lg">{nextAvailableSlot.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{nextAvailableSlot.detail}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Oferta real</p>
                <p className="mt-2 text-base font-bold text-foreground sm:text-lg">
                  {servicesCount > 0 ? `${servicesCount} servicios` : "Próximamente"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {servicesCount > 0 ? "Opciones claras con duración definida" : "Catálogo en preparación"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Desde</p>
                <p className="mt-2 text-base font-bold text-foreground sm:text-lg">{startingPriceLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {firstActiveDay ? `${firstActiveDay.dayLabel} · ${firstActiveDay.hoursLabel}` : "Horarios visibles antes de reservar"}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-border/60 bg-card/90 p-5 shadow-xl shadow-black/5 backdrop-blur lg:block lg:rounded-[2rem] lg:p-6">
            <div
              className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-cover bg-center"
              role="img"
              aria-label={profile.heroImageAlt ?? `Portada de ${businessName}`}
              style={heroImageStyle}
            />

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
              {highlightedTestimonial ? (
                <div className="rounded-xl border border-border/60 bg-background p-5">
                  <div className="flex items-center gap-2">
                    <Quote aria-hidden="true" className="size-4" style={{ color: profile.accent }} />
                    <p className="text-sm font-medium text-muted-foreground">Lo primero que perciben</p>
                  </div>
                  <p className="mt-2 text-base font-semibold leading-7 text-foreground">&ldquo;{highlightedTestimonial.quote}&rdquo;</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {highlightedTestimonial.author} · {highlightedTestimonial.detail}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-background p-5">
                  <Sparkles aria-hidden="true" className="size-5" style={{ color: profile.accent }} />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">Experiencia</p>
                  <p className="mt-1 text-base font-semibold text-foreground">Reservar es rápido y el turno se gestiona desde el mismo link.</p>
                </div>
              )}

              <div className="rounded-xl border border-border/60 bg-background p-5">
                <div className="flex items-start gap-2">
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: profile.accent }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground">{shortAddressLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {firstActiveDay ? `${firstActiveDay.dayLabel} · ${firstActiveDay.hoursLabel}` : "Horarios visibles antes de reservar"}
                    </p>
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Ver en Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
