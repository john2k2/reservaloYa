"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

// WhatsApp Icon Component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import { buttonVariants } from "@/components/ui/button-variants";
import { PublicTrackedLink } from "./public-tracked-link";
import { PublicBusinessThemeToggle } from "@/components/public-business-theme-toggle";
import { cn } from "@/lib/utils";

export function StickyHeader({
  businessSlug,
  logoLabel,
  logoUrl,
  businessName,
  bookingHref,
  whatsappHref,
  accent,
  enableDarkMode = false,
}: {
  businessSlug: string;
  logoLabel: string;
  logoUrl?: string | null;
  businessName: string;
  bookingHref: string;
  whatsappHref: string;
  accent: string;
  enableDarkMode?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border/60 bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-sm font-bold text-foreground shadow-sm",
              logoUrl ? "bg-cover bg-center text-transparent" : ""
            )}
            style={logoUrl ? { backgroundImage: `url(${logoUrl})` } : undefined}
          >
            {logoLabel}
          </div>
          <span className="hidden font-semibold text-foreground sm:block">{businessName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <PublicBusinessThemeToggle enableDarkMode={enableDarkMode} />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-10 rounded-full px-4"
            )}
          >
            <WhatsAppIcon className="mr-2 size-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <PublicTrackedLink
            businessSlug={businessSlug}
            eventName="booking_cta_clicked"
            href={bookingHref}
            pagePath={`/${businessSlug}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-10 rounded-full px-5 font-semibold"
            )}
            style={{ backgroundColor: accent, borderColor: accent }}
          >
            <Calendar className="mr-2 size-4" />
            Reservar
          </PublicTrackedLink>
        </div>
      </div>
    </header>
  );
}
