"use client";

import Link from "next/link";
import { CheckCircle2, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { productName, demoBusinessSlug } from "@/constants/site";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#precios", label: "Precios" },
];

export function LandingHeader() {
  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 bg-background border-b border-border/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-sans text-lg font-bold tracking-tight text-foreground">
            {productName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:gap-8 text-sm font-medium text-muted-foreground lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-10 items-center transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          {/* Desktop CTA */}
          <Link
            href="/admin/login"
            className="hidden h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:inline-flex"
          >
            Ingresar
          </Link>
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-10 rounded-lg px-4 font-medium shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 hidden sm:inline-flex"
            )}
          >
            Probar demo
          </Link>

          {/* Mobile Menu Button - Sólido no transparente */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-1 p-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex h-12 items-center rounded-lg px-4 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <SheetFooter>
                <Link
                  href="/admin/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full h-12 justify-center"
                  )}
                >
                  Ingresar
                </Link>
                <Link
                  href={`/${demoBusinessSlug}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full h-12 justify-center"
                  )}
                >
                  Probar demo gratis
                </Link>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-12 pt-28 text-center sm:px-6 sm:pb-16 sm:pt-32 lg:px-8 lg:pt-36">
      <AnimatedSection delay={0}>
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-3 py-1.5 sm:px-4 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:bg-secondary/50 hover:scale-105 cursor-default">
          <CheckCircle2 aria-hidden="true" className="size-3.5 text-green-600" />
          <span>Setup en 48hs · Primer mes gratis</span>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={100}>
        <h1 className="max-w-[900px] text-3xl font-bold tracking-tighter text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
          Tu negocio reserva turnos solo.{" "}
          <span className="text-muted-foreground">Vos trabajás tranquilo.</span>
        </h1>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <p className="mx-auto mt-4 sm:mt-6 max-w-[600px] text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
          Página de reservas + Agenda + Recordatorios automáticos para barberías y estéticas.{" "}
          <span className="font-medium text-foreground">Sin vivir pegado al WhatsApp.</span>
        </p>
      </AnimatedSection>

      <AnimatedSection delay={300}>
        <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 w-full sm:w-auto sm:flex-row">
          <Link
            href={`/${demoBusinessSlug}`}
            className={cn(
              "inline-flex items-center justify-center w-full sm:w-auto",
              "h-12 rounded-full px-6 sm:px-8 text-base",
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
              "h-12 w-full sm:w-auto rounded-full px-6 text-base transition-all duration-200 hover:bg-secondary hover:scale-105"
            )}
          >
            Hablar por WhatsApp
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
