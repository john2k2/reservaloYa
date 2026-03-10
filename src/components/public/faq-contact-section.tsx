import { Calendar, CheckCircle2, Facebook, Instagram } from "lucide-react";

import { TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { PublicTrackedLink } from "@/components/public/public-tracked-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqContactSectionProps = {
  slug: string;
  accentColor: string;
  surfaceTint: string;
  faqs: FaqItem[];
  policies: string[];
  whatsappHref: string;
  bookingHref: string;
  instagramHref: string | null;
  facebookHref: string | null;
  tiktokHref: string | null;
};

export function FaqContactSection({
  slug,
  accentColor,
  surfaceTint,
  faqs,
  policies,
  whatsappHref,
  bookingHref,
  instagramHref,
  facebookHref,
  tiktokHref,
}: FaqContactSectionProps) {
  return (
    <section className="border-y border-border/40 py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            Preguntas frecuentes
          </p>
          <div className="mt-6 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-bold text-card-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              Politicas del turno
            </p>
            <div className="mt-6 space-y-4">
              {policies.map((policy) => (
                <div key={policy} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: accentColor }}
                  />
                  <span>{policy}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              Contacto rapido
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 rounded-full font-semibold")}
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                <WhatsAppIcon className="mr-2 size-5" />
                WhatsApp
              </a>
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full font-semibold")}
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-4")}
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-4")}
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-full px-4")}
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
  );
}
