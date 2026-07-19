"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";

import { adminNavigation, demoBusinessSlug, productName } from "@/constants/site";
import { canAccessAdminRoute, getAdminRoleLabel } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import { ReservaYaLogo } from "@/components/brand/reservaya-logo";
import { LoadingButton } from "@/components/ui/loading-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { resendVerificationAction } from "@/app/login/actions";

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

function HeaderActions({
  businessSlug,
  userEmail,
  userRole,
  profileName,
  demoMode,
  className,
}: {
  businessSlug: string;
  userEmail: string;
  userRole: string;
  profileName: string;
  demoMode: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <div className="hidden min-w-0 text-right lg:block">
        <p className="truncate text-sm font-medium leading-tight">{profileName}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {getAdminRoleLabel(userRole)}
          <span className="mx-1 text-border">·</span>
          {userEmail}
        </p>
      </div>

      <ThemeToggle />

      <Link
        href={`/${businessSlug || demoBusinessSlug}`}
        target="_blank"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Ver página pública"
      >
        <ExternalLink className="size-4" />
      </Link>

      {!demoMode ? (
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      ) : null}
    </div>
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
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const visibleNavigation = React.useMemo(
    () => adminNavigation.filter((item) => canAccessAdminRoute(userRole, item.href)),
    [userRole]
  );
  const currentNavigationItem = React.useMemo(
    () => visibleNavigation.find((item) => item.href === pathname) ?? visibleNavigation[0] ?? null,
    [pathname, visibleNavigation]
  );

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="landing-theme flex h-dvh overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background">
      {/* Sidebar Desktop — solo navegación */}
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border/60 bg-secondary/20 xl:flex">
        <div className="shrink-0 px-4 py-6">
          <Link href="/" className="inline-flex items-center" aria-label={`Ir al inicio de ${productName}`}>
            <ReservaYaLogo size="sm" />
          </Link>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {demoMode ? "Modo demo" : "Panel"}
            </span>
            <p className="mt-1 text-sm font-medium leading-tight">{businessName}</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1 pb-4">
          {(["Operaciones", "Configuración"] as const).map((group) => {
            const items = visibleNavigation.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
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
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/60 bg-background px-4 lg:px-6">
          <div className="flex min-h-12 items-center justify-between gap-4 py-1.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 xl:hidden">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {demoMode ? "Demo" : "Panel"}
                </p>
                <h1 className="truncate text-sm font-semibold">{businessName}</h1>
              </div>
              {currentNavigationItem ? (
                <div className="hidden min-w-0 items-center gap-2 xl:flex">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentNavigationItem.label}
                  </p>
                </div>
              ) : null}
              {currentNavigationItem && !mobileNavOpen ? (
                <div className="hidden items-center gap-2 sm:flex xl:hidden">
                  <span className="text-border">|</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {currentNavigationItem.label}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <HeaderActions
                businessSlug={businessSlug}
                userEmail={userEmail}
                userRole={userRole}
                profileName={profileName}
                demoMode={demoMode}
              />

              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground xl:hidden"
                aria-expanded={mobileNavOpen}
                aria-controls="admin-mobile-menu"
                aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <div className="pb-3 xl:hidden">
              <div
                id="admin-mobile-menu"
                style={{
                  opacity: mobileNavOpen ? 1 : 0,
                  transform: mobileNavOpen ? "scale(1)" : "scale(0.95)",
                  transition: "opacity 300ms ease-out, transform 300ms ease-out",
                  pointerEvents: mobileNavOpen ? "auto" : "none",
                }}
              >
                <div className="mb-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 lg:hidden">
                  <p className="truncate text-sm font-medium">{profileName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {getAdminRoleLabel(userRole)} · {userEmail}
                  </p>
                </div>

                <nav className="grid grid-cols-2 gap-2">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] space-y-4">
            {!demoMode && !userVerified ? (
              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">Tu email todavía no está verificado.</p>
                    <p className="mt-1 text-amber-800/90">
                      Podés seguir usando el panel, pero conviene verificarlo para recuperar acceso sin depender de soporte.
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
