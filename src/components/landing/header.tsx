"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { productName, demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-transparent">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <span className="font-sans text-lg font-bold tracking-tight text-foreground">
            {productName}
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a
            href="#como-funciona"
            className="inline-flex h-11 items-center transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Cómo funciona
          </a>
          <a
            href="#beneficios"
            className="inline-flex h-11 items-center transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Beneficios
          </a>
          <a
            href="#precios"
            className="inline-flex h-11 items-center transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Precios
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin/login"
            className="hidden h-11 items-center justify-center rounded-md border border-border/80 px-4 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary/50 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:inline-flex"
          >
            Ingresar
          </Link>
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-11 rounded-md px-5 font-medium shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
            )}
          >
            Probar demo gratis
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-16 pt-32 text-center sm:px-6 lg:px-8">
      <AnimatedSection delay={0}>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:bg-secondary/50 hover:scale-105 cursor-default">
          <CheckCircle2 aria-hidden="true" className="size-3.5 text-green-600" />
          <span>Setup en 48hs · Primer mes gratis</span>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={100}>
        <h1 className="max-w-[900px] text-4xl font-bold tracking-tighter text-foreground sm:text-6xl lg:text-[4rem] leading-[1.1]">
          Tu negocio reserva turnos solo.{" "}
          <span className="text-muted-foreground">Vos trabajás tranquilo.</span>
        </h1>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <p className="mx-auto mt-6 max-w-[600px] text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Página de reservas + Agenda + Recordatorios automáticos para barberías y estéticas.{" "}
          <span className="font-medium text-foreground">Sin vivir pegado al WhatsApp.</span>
        </p>
      </AnimatedSection>

      <AnimatedSection delay={300}>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              "inline-flex items-center justify-center",
              "h-12 rounded-full px-8 text-base",
              "bg-foreground text-background font-medium",
              "shadow-lg transition-all duration-200",
              "hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 hover:bg-foreground/90"
            )}
          >
            Probar demo gratis
          </Link>
          <a
            href="https://wa.me/541155550199"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full px-6 text-base transition-all duration-200 hover:bg-secondary hover:scale-105"
            )}
          >
            Hablar por WhatsApp
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
