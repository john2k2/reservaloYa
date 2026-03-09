import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Facebook,
  Globe,
  Instagram,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Phone,
  Clock,
  Calendar,
  Scissors,
} from "lucide-react";

import { WhatsAppIcon, TikTokIcon } from "@/components/icons";
import { PublicAnalyticsTracker } from "@/components/public/public-analytics-tracker";
import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { StickyHeader } from "@/components/public/sticky-header";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatShortDateLabel, formatTimeLabel } from "@/lib/bookings/format";
import { cn } from "@/lib/utils";
import { getPublicBookingFlowData, getPublicBusinessPageData } from "@/server/queries/public";
import { PublicBusinessPageWrapper } from "@/components/public-business-page-wrapper";

const demoServices = [
  {
    id: "22222222-2222-2222-2222-222222222221",
    name: "Corte clásico",
    priceLabel: "$ 12.000",
    description: "Corte con terminación prolija para uso diario.",
    durationMinutes: 45,
    popular: false,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Corte + barba",
    priceLabel: "$ 18.000",
    description: "Servicio completo con perfilado y terminación.",
    durationMinutes: 60,
    popular: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222223",
    name: "Perfilado premium",
    priceLabel: "$ 8.000",
    description: "Repaso rápido para mantener prolijo el look.",
    durationMinutes: 30,
    popular: false,
  },
];

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
};

function buildInstagramHref(handle?: string) {
  if (!handle) return null;
  if (handle.startsWith("http://") || handle.startsWith("https://")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

function buildFacebookHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://facebook.com/${value.replace(/^@/, "")}`;
}

function buildTikTokHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://www.tiktok.com/${value.startsWith("@") ? value : `@${value}`}`;
}

function buildWebsiteHref(value?: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function buildWhatsAppHref(phone?: string, businessName?: string) {
  const normalizedPhone = (phone ?? "5491155550199").replace(/\D/g, "");
  const message = businessName
    ? `Hola ${businessName}, quiero reservar un turno.`
    : "Hola, quiero reservar un turno.";

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function buildBookingHref(input: {
  slug: string;
  serviceId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}) {
  const params = new URLSearchParams();
  if (input.serviceId) params.set("service", input.serviceId);
  if (input.source) params.set("utm_source", input.source);
  if (input.medium) params.set("utm_medium", input.medium);
  if (input.campaign) params.set("utm_campaign", input.campaign);
  const query = params.toString();
  return query ? `/${input.slug}/reservar?${query}` : `/${input.slug}/reservar`;
}

function getStartingPriceLabel(
  services: Array<{
    priceLabel?: string;
    price?: number | null;
  }>
) {
  const pricedServices = services.filter(
    (service): service is { price: number; priceLabel: string } =>
      typeof service.price === "number" && Boolean(service.priceLabel)
  );

  if (pricedServices.length === 0) {
    return "Consulta personalizada";
  }

  const cheapestService = pricedServices.reduce((currentCheapest, service) =>
    service.price < currentCheapest.price ? service : currentCheapest
  );

  return `Desde ${cheapestService.priceLabel}`;
}

function getFirstActiveDayLabel(
  weeklyHours: Array<{
    dayLabel: string;
    hoursLabel: string;
  }>
) {
  return (
    weeklyHours.find((slot) => !slot.hoursLabel.toLocaleLowerCase("es-AR").includes("cerrado")) ??
    weeklyHours[0] ??
    null
  );
}

function getShortAddressLabel(address?: string | null) {
  if (!address) {
    return "Ubicación a confirmar";
  }

  const [firstSegment] = address.split(",");
  return firstSegment?.trim() || address;
}

function getNextAvailableSlotLabel(input?: {
  bookingDate?: string;
  dateOptions?: string[];
  slots?: string[];
} | null) {
  const firstDate = input?.bookingDate ?? input?.dateOptions?.[0];
  const firstSlot = input?.slots?.[0];

  if (!firstDate || !firstSlot) {
    return {
      title: "Agenda activa",
      detail: "Mira horarios disponibles",
    };
  }

  return {
    title: formatShortDateLabel(firstDate),
    detail: formatTimeLabel(firstSlot),
  };
}

export default async function BusinessPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params;
  const tracking = await searchParams;
  const pageData = await getPublicBusinessPageData(slug);

  if (!pageData) {
    notFound();
  }

  const services = (pageData.services.length > 0 ? pageData.services : demoServices).map(
    (service, index) => ({
      ...service,
      popular: Boolean("featured" in service ? service.featured : false) || index === 0,
      featureBadge:
        "featured" in service && service.featured
          ? service.featuredLabel || "Destacado"
          : index === 0
            ? "Más elegido"
            : "",
    })
  );
  const bookingFlowPreview = services[0]
    ? await getPublicBookingFlowData({
        slug,
        serviceId: services[0].id,
      })
    : null;
  const startingPriceLabel = getStartingPriceLabel(services);
  const firstActiveDay = getFirstActiveDayLabel(pageData.weeklyHours);
  const highlightedTestimonial = pageData.profile.testimonials[0] ?? null;
  const shortAddressLabel = getShortAddressLabel(pageData.business.address);
  const nextAvailableSlot = getNextAvailableSlotLabel(bookingFlowPreview);

  const whatsappHref = buildWhatsAppHref(pageData.business.phone, pageData.business.name);
  const instagramHref = buildInstagramHref(pageData.profile.instagram);
  const facebookHref = buildFacebookHref(pageData.profile.facebook);
  const tiktokHref = buildTikTokHref(pageData.profile.tiktok);
  const websiteHref = buildWebsiteHref(pageData.profile.website);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    pageData.business.address ?? pageData.profile.mapQuery ?? pageData.business.name
  )}`;
  const mapEmbedSrc =
    pageData.profile.mapEmbedUrl ??
    `https://www.google.com/maps?q=${encodeURIComponent(
      pageData.profile.mapQuery ?? pageData.business.address ?? pageData.business.name
    )}&output=embed`;
  
  const logoLabel =
    pageData.profile.logoLabel ??
    pageData.business.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("");
  
  const heroStyle = {
    background: `radial-gradient(circle at top, ${pageData.profile.accentSoft} 0%, ${pageData.profile.surfaceTint} 48%, transparent 100%)`,
  } satisfies CSSProperties;
  
  const logoStyle = pageData.profile.logoUrl
    ? ({
        backgroundImage: `url(${pageData.profile.logoUrl})`,
      } satisfies CSSProperties)
    : undefined;
  
  const heroImageStyle = pageData.profile.heroImageUrl
    ? ({
        backgroundImage: `url(${pageData.profile.heroImageUrl})`,
      } satisfies CSSProperties)
    : undefined;

  const bookingHref = buildBookingHref({
    slug,
    source: tracking.utm_source,
    medium: tracking.utm_medium,
    campaign: tracking.utm_campaign,
  });

  return (
    <PublicBusinessPageWrapper profile={pageData.profile}>
      <main
        id="main-content"
        className="min-h-screen bg-background font-sans text-foreground selection:bg-foreground selection:text-background"
      >
        {/* Sticky Header - Client Component */}
        <StickyHeader
          businessSlug={slug}
          logoLabel={logoLabel}
          logoUrl={pageData.profile.logoUrl ?? undefined}
          businessName={pageData.business.name}
          bookingHref={bookingHref}
          whatsappHref={whatsappHref}
          accent={pageData.profile.accent}
          enableDarkMode={pageData.profile.enableDarkMode}
        />

      {/* Hero Section */}
      <section className="px-4 pb-14 pt-4 sm:px-6 sm:pb-20 sm:pt-8" style={heroStyle}>
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-sm font-bold text-foreground shadow-sm",
                  pageData.profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
                )}
                role={pageData.profile.logoUrl ? "img" : undefined}
                aria-label={pageData.profile.logoUrl ? `Logo de ${pageData.business.name}` : undefined}
                style={logoStyle}
              >
                {pageData.profile.logoUrl ? "" : logoLabel}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {pageData.profile.badge}
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{pageData.business.name}</p>
              </div>
            </div>

            {/* Social Links - Desktop */}
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

            {/* Social Links - Mobile */}
            <div className="flex flex-wrap items-center gap-2 lg:hidden">
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-10 rounded-full px-3 text-xs"
                  )}
                >
                  Web
                </a>
              )}
              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-10 rounded-full px-3 text-xs"
                  )}
                >
                  IG
                </a>
              )}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 rounded-full px-3 text-xs"
                )}
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:py-10">
            {/* Left Column */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-sm">
                  <Star className="size-3.5 fill-current" style={{ color: pageData.profile.accent }} />
                  Turnos online claros
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                  <Clock3 className="size-3.5" style={{ color: pageData.profile.accent }} />
                  Reserva en menos de 1 minuto
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                {pageData.profile.eyebrow}
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {pageData.profile.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {pageData.profile.description}
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
                  style={{ backgroundColor: pageData.profile.accent, borderColor: pageData.profile.accent }}
                >
                  <Calendar className="mr-2 size-5" />
                  {pageData.profile.primaryCta}
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
                  {pageData.profile.secondaryCta}
                </a>
              </div>

              <div className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pb-1 sm:hidden">
                <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Calendar className="size-3.5" style={{ color: pageData.profile.accent }} />
                    Próximo turno
                  </div>
                  <p className="mt-3 text-lg font-bold text-foreground">{nextAvailableSlot.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{nextAvailableSlot.detail}</p>
                </div>
                <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Scissors className="size-3.5" style={{ color: pageData.profile.accent }} />
                    Servicios activos
                  </div>
                  <p className="mt-3 text-lg font-bold text-foreground">{services.length} opciones</p>
                  <p className="mt-1 text-sm text-muted-foreground">Con precio y duracion visibles</p>
                </div>
                <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Clock className="size-3.5" style={{ color: pageData.profile.accent }} />
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
                    <MapPin className="size-3.5" style={{ color: pageData.profile.accent }} />
                    Ubicación
                  </div>
                  <p className="mt-3 text-lg font-bold text-foreground">{shortAddressLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Con acceso rapido al mapa</p>
                </div>
                <div className="min-w-[13rem] snap-start rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Star className="size-3.5 fill-current" style={{ color: pageData.profile.accent }} />
                    Valor claro
                  </div>
                  <p className="mt-3 text-lg font-bold text-foreground">{startingPriceLabel}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sin sorpresas al reservar</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {pageData.profile.trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                  >
                    <CheckCircle2 className="size-4" style={{ color: pageData.profile.accent }} />
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
                  <p className="mt-3 text-lg font-bold text-foreground">{services.length} servicios activos</p>
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
                  <p className="mt-1 text-sm text-muted-foreground">Con acceso rapido al mapa</p>
                </div>
              </div>
            </div>

            {/* Right Column - Simplified Card */}
            <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur">
              {/* Hero Image */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border/60 bg-cover bg-center",
                  heroImageStyle ? "aspect-[16/10]" : "aspect-[16/10]"
                )}
                role="img"
                aria-label={pageData.profile.heroImageAlt ?? `Portada de ${pageData.business.name}`}
                style={heroImageStyle}
              />

              {/* Features */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <Sparkles aria-hidden="true" className="size-5" style={{ color: pageData.profile.accent }} />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Experiencia</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    Reserva clara desde el primer vistazo
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <ShieldCheck aria-hidden="true" className="size-5" style={{ color: pageData.profile.accent }} />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Gestión</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    Link directo para cambiar o cancelar
                  </p>
                </div>
              </div>

              {highlightedTestimonial ? (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
                  <div className="flex items-center gap-2">
                    <Quote aria-hidden="true" className="size-4" style={{ color: pageData.profile.accent }} />
                    <p className="text-sm font-medium text-muted-foreground">Lo primero que perciben</p>
                  </div>
                  <p className="mt-3 text-base font-semibold leading-7 text-foreground">
                    “{highlightedTestimonial.quote}”
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {highlightedTestimonial.author} · {highlightedTestimonial.detail}
                  </p>
                </div>
              ) : null}

              {/* Location */}
              <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
                <div className="flex items-start gap-3">
                  <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" style={{ color: pageData.profile.accent }} />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{pageData.business.address ?? "Dirección a definir"}</p>
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

              {/* Hours - Compact */}
              <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
                <div className="flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-4" style={{ color: pageData.profile.accent }} />
                  <p className="text-sm font-medium text-muted-foreground">Horarios de atención</p>
                </div>
                <div className="mt-3 space-y-2">
                  {pageData.weeklyHours.slice(0, 4).map((slot) => (
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

      {/* Benefits Section - With accent background */}
      <section className="border-y border-border/40 py-20" style={{ backgroundColor: pageData.profile.surfaceTint }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pageData.profile.benefits.map((benefit, idx) => (
              <article
                key={benefit}
                className="rounded-3xl border border-border/60 bg-background p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: pageData.profile.accentSoft }}
                >
                  {idx === 0 ? (
                    <Clock3 className="size-6" style={{ color: pageData.profile.accent }} />
                  ) : idx === 1 ? (
                    <ShieldCheck className="size-6" style={{ color: pageData.profile.accent }} />
                  ) : (
                    <Phone className="size-6" style={{ color: pageData.profile.accent }} />
                  )}
                </div>
                <p className="mt-5 text-lg font-semibold text-card-foreground">{benefit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {pageData.profile.gallery && pageData.profile.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
              Galería
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Así se vive la experiencia del negocio
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pageData.profile.gallery.map((image, index) => (
              <article
                key={`${image.url}-${index}`}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
                data-lightbox-index={index}
              >
                <div
                  className="aspect-[4/3] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  role="img"
                  aria-label={image.alt}
                  style={{ backgroundImage: `url(${image.url})` }}
                />
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">{image.alt}</p>
                </div>
              </article>
            ))}
          </div>
          
          {/* Gallery Lightbox - Client Component */}
          <GalleryLightbox images={pageData.profile.gallery} />
        </section>
      )}

      {/* Services Section - With background */}
      <section className="border-y border-border/40 py-20" style={{ backgroundColor: pageData.profile.surfaceTint }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Servicios
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Elegí el turno que mejor encaja con tu agenda
              </h2>
            </div>
            <span className="hidden text-sm font-semibold uppercase tracking-widest text-muted-foreground sm:block">
              {services.length} opciones
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border p-6 shadow-sm transition-all hover:shadow-lg",
                  service.popular 
                    ? "border-2 bg-background" 
                    : "border-border/60 bg-background/80"
                )}
                style={service.popular ? { borderColor: pageData.profile.accent } : undefined}
              >
                {service.popular && (
                  <div
                    className="absolute -top-3 left-6 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: pageData.profile.accent }}
                  >
                    <Star className="size-3 fill-current" />
                    {service.featureBadge}
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-card-foreground">{service.name}</h3>
                  <span
                    className="rounded-full px-3 py-1.5 text-sm font-bold"
                    style={{
                      backgroundColor: pageData.profile.accentSoft,
                      color: pageData.profile.accent,
                    }}
                  >
                    {service.priceLabel}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Scissors className="size-4" style={{ color: pageData.profile.accent }} />
                  <span>{service.durationMinutes} min</span>
                </div>

                <PublicTrackedLink
                  businessSlug={slug}
                  eventName="booking_cta_clicked"
                  href={buildBookingHref({
                    slug,
                    serviceId: service.id,
                    source: tracking.utm_source,
                    medium: tracking.utm_medium,
                    campaign: tracking.utm_campaign,
                  })}
                  pagePath={`/${slug}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "mt-6 h-12 rounded-full font-semibold transition-transform hover:scale-[1.02]",
                    service.popular ? "" : "bg-foreground hover:bg-foreground/90"
                  )}
                  style={service.popular ? { backgroundColor: pageData.profile.accent, borderColor: pageData.profile.accent } : undefined}
                >
                  Reservar este servicio
                </PublicTrackedLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
            Testimonios
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            La confianza no sale de promesas vacías. Sale de una experiencia clara, rápida y fácil de repetir.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
              <Star className="size-4 fill-current" style={{ color: pageData.profile.accent }} />
              Experiencia entendible desde el primer vistazo
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
              <ShieldCheck className="size-4" style={{ color: pageData.profile.accent }} />
              Reprogramación simple sin llamadas cruzadas
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {pageData.profile.testimonials.map((testimonial) => (
            <article
              key={testimonial.author}
              className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <Quote aria-hidden="true" className="size-8" style={{ color: pageData.profile.accent }} />
                <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  <Star className="size-3 fill-current" style={{ color: pageData.profile.accent }} />
                  Confianza real
                </div>
              </div>
              <p className="mt-5 text-lg leading-8 text-card-foreground">{testimonial.quote}</p>
              <div className="mt-6 flex items-center gap-4">
                {testimonial.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="size-14 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div
                    className="flex size-14 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: pageData.profile.accent }}
                  >
                    {testimonial.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ & Policies Section */}
      <section className="border-y border-border/40 py-20" style={{ backgroundColor: pageData.profile.surfaceTint }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* FAQ */}
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
              Preguntas frecuentes
            </p>
            <div className="mt-6 space-y-6">
              {pageData.profile.faqs.map((faq) => (
                <div key={faq.question} className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-bold text-card-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Policies & Contact */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Políticas del turno
              </p>
              <div className="mt-6 space-y-4">
                {pageData.profile.policies.map((policy) => (
                  <div key={policy} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: pageData.profile.accent }}
                    />
                    <span>{policy}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
                Contacto rápido
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-12 rounded-full font-semibold"
                  )}
                  style={{ backgroundColor: pageData.profile.accent, borderColor: pageData.profile.accent }}
                >
                  <WhatsAppIcon className="mr-2 size-5" />
                  WhatsApp
                </a>
                <PublicTrackedLink
                  businessSlug={slug}
                  eventName="booking_cta_clicked"
                  href={bookingHref}
                  pagePath={`/${slug}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-full font-semibold"
                  )}
                >
                  <Calendar className="mr-2 size-5" />
                  Reservar online
                </PublicTrackedLink>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {instagramHref && (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-10 rounded-full px-4"
                    )}
                  >
                    <Instagram aria-hidden="true" className="mr-2 size-4" />
                    Instagram
                  </a>
                )}
                {facebookHref && (
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-10 rounded-full px-4"
                    )}
                  >
                    <Facebook aria-hidden="true" className="mr-2 size-4" />
                    Facebook
                  </a>
                )}
                {tiktokHref && (
                  <a
                    href={tiktokHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-10 rounded-full px-4"
                    )}
                  >
                    <TikTokIcon className="mr-2 size-4" />
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: pageData.profile.accent }}>
            Ubicación
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {pageData.business.address ?? "Dirección a definir"}
          </h2>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 shadow-sm">
          <iframe
            title={`Mapa de ${pageData.business.name}`}
            src={mapEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full"
          />
        </div>
      </section>

      {/* Improved Footer */}
      <footer className="border-t border-border/40 bg-background py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background text-sm font-bold text-foreground shadow-sm",
                    pageData.profile.logoUrl ? "bg-cover bg-center text-transparent" : ""
                  )}
                  style={logoStyle}
                >
                  {logoLabel}
                </div>
                <span className="font-bold text-foreground">{pageData.business.name}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {pageData.profile.description.slice(0, 80)}...
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-sm font-bold text-foreground">Links rápidos</p>
              <div className="mt-4 flex flex-col gap-2">
                <PublicTrackedLink
                  businessSlug={slug}
                  eventName="booking_cta_clicked"
                  href={bookingHref}
                  pagePath={`/${slug}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reservar turno
                </PublicTrackedLink>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contactar por WhatsApp
                </a>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver ubicación
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-bold text-foreground">Contacto</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">{pageData.business.address ?? "Dirección a definir"}</p>
                <div className="flex flex-wrap gap-2">
                  {instagramHref && (
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Instagram className="size-4" />
                    </a>
                  )}
                  {facebookHref && (
                    <a
                      href={facebookHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Facebook className="size-4" />
                    </a>
                  )}
                  {tiktokHref && (
                    <a
                      href={tiktokHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <TikTokIcon className="size-4" />
                    </a>
                  )}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <WhatsAppIcon className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {pageData.business.name}. Todos los derechos reservados.
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Desarrollado con <span className="font-bold text-foreground">ReservaYa</span>
            </p>
          </div>
        </div>
      </footer>

        <PublicAnalyticsTracker
          businessSlug={slug}
          eventName="public_page_view"
          pagePath={`/${slug}`}
        />
      </main>
    </PublicBusinessPageWrapper>
  );
}
