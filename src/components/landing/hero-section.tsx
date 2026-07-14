import Link from "next/link";

import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { TicketStub } from "./ticket-stub";

export function HeroSection() {
  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-40">
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <AnimatedSection delay={0}>
          <p className="font-display text-2xl font-semibold tracking-tight text-sello sm:text-3xl">
            ReservaYa
          </p>
        </AnimatedSection>

        <AnimatedSection delay={80}>
          <h1 className="mt-4 max-w-[620px] font-display text-4xl font-bold leading-[1.05] text-balance text-foreground sm:mt-5 sm:text-5xl lg:text-6xl">
            Dejá de perder clientes por WhatsApp
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={160}>
          <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-pretty text-muted-foreground sm:mt-8 sm:text-xl">
            Tus clientes reservan online. Vos recibís el turno confirmado y reducís las ausencias.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={240}>
          <div className="mt-10 flex w-full flex-col flex-wrap items-center justify-center gap-4 sm:mt-12 sm:w-auto sm:flex-row lg:justify-start">
            <Link
              href="/admin/signup"
              className={cn(
                "group inline-flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-8 text-base sm:w-auto",
                "bg-foreground font-semibold text-background",
                "transition-[transform,box-shadow] duration-300",
                "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/10 active:scale-[0.98]"
              )}
            >
              Probar 15 días gratis
              <svg
                className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
              href="#demos"
              className={cn(
                "inline-flex h-14 w-full items-center justify-center whitespace-nowrap rounded-full px-6 text-base sm:w-auto",
                "border border-rule font-medium text-foreground",
                "transition-colors duration-300 hover:bg-secondary/50"
              )}
            >
              Ver demos en vivo
            </a>
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection delay={160} animation="fadeInScale" className="flex justify-center lg:justify-end">
        <TicketStub />
      </AnimatedSection>
    </section>
  );
}
