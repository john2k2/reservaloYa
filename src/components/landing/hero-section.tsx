import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { TicketStub } from "./ticket-stub";

export function HeroSection() {
  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-40">
      <div className="pointer-events-none absolute left-10 top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />

      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <AnimatedSection delay={0}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur-sm sm:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ticket opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ticket" />
            </span>
            <span>15 días gratis · Sin tarjeta de crédito</span>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <h1 className="max-w-[620px] font-display text-4xl font-bold leading-[1.05] text-balance text-foreground sm:text-5xl lg:text-6xl">
            <span className="inline">Dejá de perder clientes&nbsp;</span>
            <span className="relative inline">
              por WhatsApp
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path
                  d="M2 6C50 2 150 2 198 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/40"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="mt-2 block font-display text-2xl font-normal italic text-muted-foreground sm:text-3xl">
              Automatizá tus turnos y reducí las ausencias.
            </span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-pretty text-muted-foreground sm:mt-8 sm:text-xl lg:max-w-[480px]">
            Tu negocio merece un sistema profesional. Tus clientes reservan online, vos recibís
            notificaciones y reducís las ausencias.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="mt-10 flex w-full flex-col flex-wrap items-center justify-center gap-4 sm:mt-12 sm:w-auto sm:flex-row lg:justify-start">
            <Link
              href="/admin/signup"
              className={cn(
                "group inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 text-base sm:w-auto",
                "bg-foreground font-semibold text-background shadow-xl shadow-foreground/10",
                "transition-[transform,box-shadow] duration-300",
                "hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-foreground/20 active:scale-[0.96]"
              )}
            >
              Comenzar mis 15 días gratis
              <svg
                className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <a
              href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-14 w-full items-center justify-center whitespace-nowrap rounded-full px-6 text-base sm:w-auto",
                "border border-border/80 font-medium",
                "transition-colors duration-300 hover:border-foreground/20 hover:bg-secondary/50"
              )}
            >
              ¿Dudas? Escribinos al WhatsApp
            </a>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <div className="mt-12 flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Sin permanencia</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Setup en 5 minutos</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>Soporte por WhatsApp</span>
            </div>
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection delay={200} animation="fadeInScale" className="flex justify-center lg:justify-end">
        <TicketStub />
      </AnimatedSection>
    </section>
  );
}
