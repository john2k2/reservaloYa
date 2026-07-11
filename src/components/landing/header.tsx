"use client";

import Link from "next/link";
import { useEffect, useState, startTransition } from "react";
import { Menu, User } from "lucide-react";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/funcionalidades", label: "Beneficios" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/preguntas-frecuentes", label: "Preguntas" },
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
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-10 items-center transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {link.label}
            </Link>
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
              "h-12 sm:h-10 rounded-lg px-5 sm:px-4 font-semibold shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90"
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
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex h-12 items-center rounded-lg px-4 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
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
                    "w-full h-14 justify-center text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
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
