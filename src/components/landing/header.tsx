"use client";

import Link from "next/link";
import { useEffect, useState, startTransition } from "react";
import { CheckCircle2, Menu, User } from "lucide-react";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { getSiteWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

interface SessionInfo {
  loggedIn: boolean;
  isPlatformAdmin: boolean;
  displayName: string;
}

async function getSessionInfo(signal?: AbortSignal): Promise<SessionInfo> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store", signal });
    if (!res.ok) return { loggedIn: false, isPlatformAdmin: false, displayName: "" };
    return res.json();
  } catch {
    return { loggedIn: false, isPlatformAdmin: false, displayName: "" };
  }
}

function UserButton({ session }: { session: SessionInfo }) {
  if (!session.loggedIn) {
    return (
      <Link
        href="/login"
        className="hidden h-10 items-center justify-center rounded-lg border-2 border-border bg-background px-5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:inline-flex"
      >
        Ingresar
      </Link>
    );
  }

  return (
    <Link
      href={session.isPlatformAdmin ? "/platform/dashboard" : "/admin/dashboard"}
      className="hidden h-10 items-center justify-center gap-2 rounded-lg border-2 border-border bg-secondary px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background lg:inline-flex"
    >
      <User className="size-4" />
      <span>{session.displayName}</span>
    </Link>
  );
}

function MobileUserButton({ session }: { session: SessionInfo }) {
  if (!session.loggedIn) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full h-12 justify-center"
        )}
      >
        Ingresar
      </Link>
    );
  }

  return (
    <Link
      href={session.isPlatformAdmin ? "/platform/dashboard" : "/admin/dashboard"}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "w-full h-12 justify-center"
      )}
    >
      {session.displayName}
    </Link>
  );
}

export function LandingHeader() {
  const [session, setSession] = useState<SessionInfo>({ loggedIn: false, isPlatformAdmin: false, displayName: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    startTransition(() => {
      setMounted(true);
    });

    getSessionInfo(controller.signal).then((sessionInfo) => {
      if (!controller.signal.aborted) {
        setSession(sessionInfo);
      }
    });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 bg-background border-b border-border/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center" aria-label="Ir al inicio de ReservaYa">
          <ReservaYaLogo size="md" />
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
          {mounted && <UserButton session={session} />}
          {!mounted && (
            <div className="hidden h-10 w-20 animate-pulse rounded-lg bg-secondary lg:inline-flex" />
          )}

          <Link
            href="/admin/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-12 sm:h-10 rounded-lg px-5 sm:px-4 font-semibold shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 hidden sm:inline-flex"
            )}
          >
            Comenzar gratis
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
              <SheetFooter className="gap-2">
                {mounted ? (
                  <MobileUserButton session={session} />
                ) : (
                  <div className="h-12 w-full animate-pulse rounded-lg bg-secondary" />
                )}
                <Link
                  href="/admin/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full h-14 justify-center text-base font-semibold"
                  )}
                >
                  Comenzar gratis
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
    <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-32 text-center sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      <AnimatedSection delay={0}>
        <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>15 días gratis · Sin tarjeta de crédito</span>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={100}>
        <h1 className="max-w-[950px] text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] font-display">
          Dejá de perder clientes{" "}
          <span className="relative">
            por WhatsApp
            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
              <path d="M2 6C50 2 150 2 198 6" stroke="currentColor" strokeWidth="3" className="text-primary/40" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="block mt-2 text-muted-foreground font-display italic font-normal text-3xl sm:text-4xl lg:text-5xl">
            Automatizá tus turnos y reducí las ausencias.
          </span>
        </h1>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <p className="mx-auto mt-6 sm:mt-8 max-w-[550px] text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Tu negocio merece un sistema profesional. Tus clientes reservan online, vos recibís notificaciones y reducís las ausencias.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={300}>
        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4 w-full sm:w-auto sm:flex-row">
          <Link
            href="/admin/signup"
            className={cn(
              "group inline-flex items-center justify-center gap-2 w-full sm:w-auto",
              "h-14 rounded-full px-8 text-base",
              "bg-foreground text-background font-semibold",
              "shadow-xl shadow-foreground/10",
              "transition-all duration-300",
              "hover:shadow-2xl hover:shadow-foreground/20 hover:scale-[1.02] hover:-translate-y-0.5"
            )}
          >
            Comenzar mis 15 días gratis
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href={getSiteWhatsAppHref("Hola, quiero conocer ReservaYa.")}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center w-full sm:w-auto",
              "h-14 rounded-full px-6 text-base",
              "border border-border/80 font-medium",
              "transition-all duration-300 hover:bg-secondary/50 hover:border-foreground/20"
            )}
          >
            ¿Dudas? Escribinos al WhatsApp
          </a>
        </div>
      </AnimatedSection>

      {/* Trust indicators */}
      <AnimatedSection delay={400}>
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Sin permanencia</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Setup en 5 minutos</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Soporte por WhatsApp</span>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
