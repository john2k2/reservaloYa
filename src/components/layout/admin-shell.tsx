"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { adminNavigation, demoBusinessSlug, productName } from "@/constants/site";
import { cn } from "@/lib/utils";
import { LoadingButton } from "@/components/ui/loading-button";
import { resendVerificationAction } from "@/app/admin/login/actions";

interface AdminShellProps {
  children: React.ReactNode;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  userRole: string;
  userVerified: boolean;
  profileName: string;
  demoMode: boolean;
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const current = resolvedTheme || theme;
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isDark = mounted && (resolvedTheme ?? theme) === "dark";
  return (
    <button
      type="button"
      onClick={handleToggle}
      className="relative z-10 flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

export function AdminShell({
  children,
  businessName,
  businessSlug,
  userEmail,
  userRole,
  userVerified,
  profileName,
  demoMode,
}: AdminShellProps) {
  const pathname = usePathname();
  const visibleNavigation = React.useMemo(
    () => adminNavigation.filter((item) => userRole === "owner" || item.href !== "/admin/team"),
    [userRole]
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-56 flex-col border-r border-border/60 bg-secondary/20 xl:flex">
        <div className="px-4 py-6">
          <Link href="/" className="inline-flex items-center text-lg font-bold tracking-tight">
            {productName}
          </Link>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {demoMode ? "Modo demo" : "Panel"}
            </span>
            <p className="mt-1 text-sm font-medium leading-tight">{businessName}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3 space-y-1">
          <div className="rounded-lg bg-secondary/40 p-3 mb-2">
            <p className="truncate text-sm font-medium">{profileName}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {userRole === "owner" ? "Owner" : "Staff"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>

          <ThemeToggle />

          <Link
            href={`/${businessSlug || demoBusinessSlug}`}
            target="_blank"
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            Ver página pública
          </Link>

          {!demoMode && (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="border-b border-border/60 bg-background px-4 lg:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {demoMode ? "Demo" : "Admin"}
              </p>
              <h1 className="truncate text-sm font-semibold">{businessName}</h1>
            </div>
            <Link
              href={`/${businessSlug || demoBusinessSlug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground xl:hidden"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Ver página</span>
            </Link>
          </div>

          {/* Navigation Mobile */}
          <nav className="flex gap-1 overflow-x-auto pb-3 xl:hidden scrollbar-hide">
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] space-y-4">
            {!demoMode && !userVerified ? (
              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">Tu email todavía no está verificado.</p>
                    <p className="mt-1 text-amber-800/90">
                      Puedes seguir usando el panel, pero conviene verificarlo para recuperar acceso sin depender de soporte.
                    </p>
                  </div>
                  <form action={resendVerificationAction}>
                    <LoadingButton
                      pendingLabel="Reenviando..."
                      className="h-11 rounded-xl bg-amber-950 px-4 font-medium text-white"
                    >
                      Reenviar verificación
                    </LoadingButton>
                  </form>
                </div>
              </section>
            ) : null}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
