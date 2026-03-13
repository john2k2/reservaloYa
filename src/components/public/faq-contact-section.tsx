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
  mobileFaqCount?: number;
  mobilePolicyCount?: number;
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
  mobileFaqCount = 2,
  mobilePolicyCount = 2,
}: FaqContactSectionProps) {
  return (
    <section className="border-y border-border/40 py-12 sm:py-16 lg:py-20" style={{ backgroundColor: surfaceTint }}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:rounded-3xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: accentColor }}>
            Preguntas frecuentes
          </p>
          <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={cn(
                  "border-b border-border/50 pb-5 last:border-b-0 last:pb-0 sm:pb-6",
                  index >= mobileFaqCount ? "hidden sm:block" : ""
                )}
              >
                <h3 className="text-base font-bold text-card-foreground sm:text-lg">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          {faqs.length > mobileFaqCount ? (
            <p className="mt-4 text-xs text-muted-foreground sm:hidden">
              Dejamos solo lo clave en celular para que el cierre sea más directo.
            </p>
          ) : null}
        </div>

        <div className="space-y-5 sm:space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:rounded-3xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: accentColor }}>
              Políticas del turno
            </p>
            <div className="mt-5 space-y-4 sm:mt-6">
              {policies.map((policy, index) => (
                <div
                  key={policy}
                  className={cn(
                    "flex gap-3 text-sm leading-6 text-muted-foreground",
                    index >= mobilePolicyCount ? "hidden sm:flex" : ""
                  )}
                >
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: accentColor }} />
                  <span>{policy}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:rounded-3xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest sm:text-sm" style={{ color: accentColor }}>
              Cierre rápido
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Si el usuario llegó hasta acá, lo mejor es resolver la reserva o una duda puntual sin desviar el flujo.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <PublicTrackedLink
                businessSlug={slug}
                eventName="booking_cta_clicked"
                href={bookingHref}
                pagePath={`/${slug}`}
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-12 rounded-full font-semibold")}
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                <Calendar className="mr-2 size-5" />
                Reservar online
              </PublicTrackedLink>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full font-semibold")}
              >
                <WhatsAppIcon className="mr-2 size-5" />
                Soporte por WhatsApp
              </a>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-11 rounded-full px-4")}
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-11 rounded-full px-4")}
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
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-11 rounded-full px-4")}
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
