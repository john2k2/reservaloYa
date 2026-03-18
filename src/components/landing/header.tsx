"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Menu, User } from "lucide-react";
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

interface SessionInfo {
  loggedIn: boolean;
  isPlatformAdmin: boolean;
  displayName: string;
}

async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
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
        href="/admin/login"
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
        href="/admin/login"
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
    setMounted(true);
    getSessionInfo().then(setSession);
  }, []);

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
    <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-12 pt-28 text-center sm:px-6 sm:pb-16 sm:pt-32 lg:px-8 lg:pt-36">
      <AnimatedSection delay={0}>
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 sm:px-4 text-xs font-medium text-green-700 dark:text-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-green-500/20 cursor-default">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          <span>15 días gratis · Sin tarjeta de crédito</span>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={100}>
        <h1 className="max-w-[900px] text-3xl font-bold tracking-tighter text-foreground sm:text-4xl lg:text-5xl leading-[1.1]">
          Dejá de perder clientes por WhatsApp.{" "}
          <span className="text-muted-foreground">Automatizá tus turnos y reducí las ausencias.</span>
        </h1>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <p className="mx-auto mt-4 sm:mt-6 max-w-[600px] text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
          Tus clientes reservan online, vos recibís notificaciones y reducís las ausencias.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={300}>
        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-4 w-full sm:w-auto sm:flex-row">
          <Link
            href="/admin/signup"
            className={cn(
              "inline-flex items-center justify-center w-full sm:w-auto",
              "h-14 sm:h-12 rounded-full px-8 sm:px-8 text-base sm:text-lg",
              "bg-foreground text-background font-semibold",
              "shadow-lg transition-all duration-200",
              "hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 hover:bg-foreground/90"
            )}
          >
            Comenzar mis 15 días gratis
          </Link>
          <a
            href="https://wa.me/541155550199"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center w-full sm:w-auto",
              "h-14 sm:h-12 rounded-full px-6 sm:px-6 text-base sm:text-base",
              "border-2 border-border font-medium",
              "transition-all duration-200 hover:bg-secondary hover:scale-105"
            )}
          >
            ¿Dudas? Escribinos al WhatsApp
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
